import { Dialog } from '@headlessui/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import { useAuth } from '../contexts/AuthContext'

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(true)
    const navigate = useNavigate()
    const { user, isAuthenticated, pendingAction, authModalOpen, setAuthModalOpen } = useAuth()

    useEffect(() => {
        if (isAuthenticated && authModalOpen && user) {
            setAuthModalOpen(false)

            if (!pendingAction || pendingAction.type === 'tokenExpired') {
                setTimeout(() => {
                    if (user.role === 'admin') {
                        navigate('/admin')
                    } else {
                        navigate('/dashboard')
                    }
                }, 100)
            }
        }
    }, [isAuthenticated, user, pendingAction, authModalOpen, navigate, setAuthModalOpen])

    const handleAuthSuccess = () => {
        // Auth completed, let useEffect handle the redirect
    }

    return (
        <Dialog open={authModalOpen} onClose={() => setAuthModalOpen(false)} className="relative z-50">
            <div className="fixed inset-0 bg-[#0f2018]/45 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="surface-card w-full max-w-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white">
                        <Dialog.Title className="text-lg font-semibold">Authentication Required</Dialog.Title>
                        <p className="mt-1 text-sm text-[#edfdf8]">Sign in to continue your pending action.</p>
                    </div>
                    <div className="bg-white/95 p-6">
                        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f2f7eb] p-1">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isLogin ? 'bg-white text-[#25352a] shadow-sm' : 'text-[#65766b]'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!isLogin ? 'bg-white text-[#25352a] shadow-sm' : 'text-[#65766b]'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                        {isLogin ? <Login onSuccess={handleAuthSuccess} /> : <Signup onSuccess={handleAuthSuccess} />}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default AuthModal
