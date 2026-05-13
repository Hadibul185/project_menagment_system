import React, { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

const ManageUsersModal = ({ isOpen, closeModal }) => {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchUsers()
        }
    }, [isOpen])

    const fetchUsers = async () => {
        setIsLoading(true)
        setErrorMessage('')
        try {
            const response = await api.get('/auth/users')
            setUsers(response.data)
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Failed to load users'
            console.error('Failed to load users:', {
                status: error?.response?.status,
                code: error?.response?.data?.code || error?.code,
                message
            })
            setErrorMessage(message)
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/auth/user/${userId}/role`, { role: newRole })
            toast.success('Role updated successfully')
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update role')
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return
        try {
            await api.delete(`/auth/user/${userId}`)
            toast.success('User deleted successfully')
            setUsers(users.filter(u => u._id !== userId))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user')
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
                            <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-[#d8e3c9] bg-white">
                                <Dialog.Title as='div' className={'sticky top-0 z-10 bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white'}>
                                    <h1 className='text-lg font-semibold'>Manage Users</h1>
                                    <button onClick={closeModal} className='absolute right-6 top-4 rounded text-white hover:bg-white/20 focus:outline-none focus:ring focus:ring-offset-1 focus:ring-white/40 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                
                                <div className='flex-1 overflow-y-auto p-6 bg-white'>
                                    {isLoading ? (
                                        <div className='flex justify-center p-8'>Loading users...</div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-[#d8e3c9]">
                                            <table className="w-full text-left text-sm text-[#2f4035]">
                                                <thead className="bg-[#f3f8ec] text-xs uppercase text-[#4a5f51]">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold">Name</th>
                                                        <th className="px-6 py-4 font-semibold">Email</th>
                                                        <th className="px-6 py-4 font-semibold">Joined</th>
                                                        <th className="px-6 py-4 font-semibold">Role</th>
                                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#d8e3c9]">
                                                    {users.map((user) => (
                                                        <tr key={user._id} className="hover:bg-[#f9fbf7] transition-colors">
                                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                                            <td className="px-6 py-4">{user.email}</td>
                                                            <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <select
                                                                    value={user.role}
                                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                                    disabled={currentUser?.role !== 'superadmin' && (user.role === 'admin' || user.role === 'superadmin')}
                                                                    className="rounded-lg border border-[#ccd7bb] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#e86a33] focus:ring-1 focus:ring-[#e86a33] disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <option value="user">User</option>
                                                                    <option value="admin">Admin</option>
                                                                    <option value="superadmin">Super Admin</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleDeleteUser(user._id)}
                                                                    disabled={currentUser?.role !== 'superadmin' && (user.role === 'admin' || user.role === 'superadmin')}
                                                                    className="rounded-lg p-2 text-[#d9480f] hover:bg-[#ffe8e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                                    title="Delete User"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {errorMessage && !isLoading && (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-sm text-[#d9480f]">
                                                                {errorMessage}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {users.length === 0 && !isLoading && !errorMessage && (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-8 text-center text-sm text-[#607367]">
                                                                No users found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default ManageUsersModal
