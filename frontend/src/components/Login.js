import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BtnPrimary from './BtnPrimary'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

const Login = ({ onSuccess }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [requiresCode, setRequiresCode] = useState(false)
    const [code, setCode] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }
        
        setLoading(true)

        try {
            if (requiresCode) {
                if (!code) {
                    toast.error('Please enter the verification code')
                    setLoading(false)
                    return
                }
                const response = await api.post('/auth/verify-login', { email, code })
                if (response.data && response.data.user && response.data.token) {
                    login(response.data.user, response.data.token)
                    toast.success('Verification and login successful!')
                    onSuccess && onSuccess()
                    if (!onSuccess) {
                        navigate(response.data.user.role === 'user' ? '/dashboard' : '/admin')
                    }
                } else {
                    toast.error('Invalid response from server')
                }
            } else {
                const response = await api.post('/auth/login', { email, password })

                if (response.status === 202 && response.data.requires_code) {
                    setRequiresCode(true)
                    toast.success('Please check the backend terminal for your verification code.')
                    setLoading(false)
                    return
                }

                if (response.data && response.data.user && response.data.token) {
                    login(response.data.user, response.data.token)
                    toast.success('Login successful!')
                    onSuccess && onSuccess()
                    if (!onSuccess) {
                        navigate(response.data.user.role === 'user' ? '/dashboard' : '/admin')
                    }
                } else {
                    toast.error('Invalid response from server')
                }
            }
        } catch (error) {
            console.error('Login error:', error)
            const message = error?.response?.data?.message || error?.message || 'Login failed'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {!requiresCode ? (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#2f4035]">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="fancy-input"
                            placeholder="Email address"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#2f4035]">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="fancy-input"
                            placeholder="Password"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="code" className="mb-2 block text-sm font-semibold text-[#2f4035]">Verification Code</label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="fancy-input text-center text-xl tracking-[0.2em] font-mono"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                </div>
            )}

            <BtnPrimary type="submit" disabled={loading} className="w-full py-3 text-base font-semibold">
                {loading ? (requiresCode ? 'Verifying...' : 'Signing in...') : (requiresCode ? 'Verify Login' : 'Sign in')}
            </BtnPrimary>
        </form>
    )

    if (onSuccess) return formContent

    return (
        <div className="page-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
            <div className="surface-card fade-up grid w-full max-w-5xl overflow-hidden lg:grid-cols-2">
                <div className="relative hidden bg-gradient-to-br from-[#e86a33] to-[#0f9d90] p-10 text-white lg:block">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffe3d4]">ProjectFlow</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight">Ship projects with style and speed.</h1>
                    <p className="mt-4 text-sm text-[#ecfff9]">Track tasks, align teams, and stay in control with a workspace that feels clear and energizing.</p>
                </div>
                <div className="bg-white/90 p-7 sm:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c75a2a]">Welcome Back</p>
                    <h2 className="mt-2 text-3xl font-semibold text-[#213227]">Sign in to continue</h2>
                    <p className="mt-2 text-sm text-[#617367]">Access your dashboards, boards, and team activity.</p>
                    <div className="mt-7">{formContent}</div>
                    <p className="mt-6 text-sm text-[#5b6d61]">
                        Need an account? <Link to="/signup" className="font-semibold text-[#c75a2a] hover:text-[#a9481d]">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
