import React, { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

const EditProfileModal = ({ isOpen, closeModal }) => {
    const { user, login } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen && user) {
            setName(user.name)
            setEmail(user.email)
            setPassword('')
        }
    }, [isOpen, user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name || !email) {
            toast.error('Name and email are required')
            return
        }

        setIsLoading(true)
        try {
            const response = await api.put('/auth/profile', {
                name,
                email,
                password: password || undefined
            })
            
            // Update auth context
            if (response.data?.user && response.data?.token) {
                login(response.data.user, response.data.token)
                toast.success('Profile updated successfully')
                closeModal()
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as='div' open={isOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 overflow-y-auto">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[#0f2018]/45 backdrop-blur-sm" />
                    </Transition.Child>
                    
                    <div className="fixed inset-0 flex items-center justify-center p-4 w-screen h-screen">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-3xl border border-[#d8e3c9] bg-white">
                                <Dialog.Title as='div' className={'sticky top-0 bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white'}>
                                    <h1 className='text-lg font-semibold'>Edit Profile</h1>
                                    <button onClick={closeModal} className='absolute right-6 top-4 rounded text-white hover:bg-white/20 focus:outline-none focus:ring focus:ring-offset-1 focus:ring-white/40 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                
                                <form onSubmit={handleSubmit} className='bg-white/95 px-8 py-6'>
                                    <div className='space-y-4'>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Name</label>
                                            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className='fancy-input' placeholder='Your name' required />
                                        </div>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Email</label>
                                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className='fancy-input' placeholder='Your email' required />
                                        </div>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>New Password</label>
                                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className='fancy-input' placeholder='Leave blank to keep current password' minLength="6" />
                                        </div>
                                    </div>
                                    
                                    <div className='mt-8 flex justify-end gap-3'>
                                        <button type="button" onClick={closeModal} className='rounded-2xl border border-[#d8e3c9] bg-white px-5 py-2.5 text-sm font-semibold text-[#2f4035] transition hover:bg-[#f3f8ec]'>Cancel</button>
                                        <button type="submit" disabled={isLoading} className='rounded-2xl bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed'>
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default EditProfileModal
