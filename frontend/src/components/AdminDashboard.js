import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import AddProjectModal from './AddProjectModal'
import EditProfileModal from './EditProfileModal'
import ManageUsersModal from './ManageUsersModal'
import api from '../api'

const AdminDashboard = () => {
    const { user, logout, pendingAction, clearPendingAction } = useAuth()
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalUsers: 0,
        activeTasks: 0
    })
    const [isModalOpen, setModalState] = useState(false)
    const [isProfileModalOpen, setProfileModalOpen] = useState(false)
    const [isManageUsersModalOpen, setManageUsersModalOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'superadmin') {
            navigate('/dashboard')
            return
        }
        if (pendingAction && (pendingAction.type === 'addProject' || pendingAction.type === 'createProject')) {
            setModalState(true)
            clearPendingAction()
        }
        fetchStats()
    }, [user, navigate, pendingAction, clearPendingAction])

    const fetchStats = async () => {
        try {
            const [projectsRes, usersRes] = await Promise.all([
                api.get('/projects'),
                api.get('/auth/users')
            ])

            setStats({
                totalProjects: projectsRes.data.length,
                totalUsers: usersRes.data.length,
                activeTasks: projectsRes.data.reduce((acc, project) => {
                    const taskCount = Array.isArray(project.task) ? project.task.length : 0
                    return acc + taskCount
                }, 0)
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    if (!user) return <div className="page-shell flex min-h-screen items-center justify-center text-[#3c4f42]">Loading...</div>

    return (
        <div className="page-shell min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="surface-card fade-up overflow-hidden p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-[#be5828]">Admin Dashboard</p>
                            <h1 className="mt-3 text-3xl font-semibold text-[#223228]">Hello, {user.name}</h1>
                            <p className="mt-2 text-[#5f7165]">Manage projects, users, and active work across your team.</p>
                        </div>
                        <button onClick={handleLogout} className="inline-flex items-center justify-center rounded-2xl bg-[#d4511b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b84514]">Logout</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 xl:grid-cols-3">
                    <div className="surface-card fade-up stagger-1 p-6">
                        <p className="text-sm text-[#607367]">Total Projects</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{stats.totalProjects}</p>
                        <p className="mt-3 text-sm text-[#607367]">Current project count.</p>
                    </div>
                    <div className="surface-card fade-up stagger-2 p-6">
                        <p className="text-sm text-[#607367]">Total Users</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{stats.totalUsers}</p>
                        <p className="mt-3 text-sm text-[#607367]">Users registered in your workspace.</p>
                    </div>
                    <div className="surface-card fade-up stagger-3 p-6">
                        <p className="text-sm text-[#607367]">Active Tasks</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{stats.activeTasks}</p>
                        <p className="mt-3 text-sm text-[#607367]">Open tasks across all projects.</p>
                    </div>
                </div>

                <div className="surface-card mt-8 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-[#1f2f24]">Admin Actions</h2>
                            <p className="mt-1 text-sm text-[#607367]">Quick links for managing project operations.</p>
                        </div>
                        <button onClick={() => navigate('/')} className="rounded-2xl bg-[#0f9d90] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b887d]">Go to Projects</button>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <button
                            onClick={() => setModalState(true)}
                            className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]"
                        >
                            Add Project
                        </button>
                        <button
                            onClick={() => setManageUsersModalOpen(true)}
                            className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]"
                        >
                            Manage Users
                        </button>
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]"
                        >
                            Update Profile
                        </button>
                    </div>
                </div>
            </div>
            <AddProjectModal isModalOpen={isModalOpen} closeModal={() => setModalState(false)} />
            <EditProfileModal isOpen={isProfileModalOpen} closeModal={() => setProfileModalOpen(false)} />
            <ManageUsersModal isOpen={isManageUsersModalOpen} closeModal={() => setManageUsersModalOpen(false)} />
        </div>
    )
}

export default AdminDashboard
