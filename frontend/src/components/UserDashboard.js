import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import EditProfileModal from './EditProfileModal'

import api from '../api'

const UserDashboard = () => {
    const { user, logout, pendingAction, clearPendingAction } = useAuth()
    const [projects, setProjects] = useState([])
    const [myTasks, setMyTasks] = useState([])
    const [isProfileModalOpen, setProfileModalOpen] = useState(false)
    const [isModalOpen, setModalState] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (pendingAction && (pendingAction.type === 'addProject' || pendingAction.type === 'createProject')) {
            setModalState(true)
            clearPendingAction()
        }
        fetchUserData()
    }, [pendingAction, clearPendingAction])

    const fetchUserData = async () => {
        try {
            const response = await api.get('/projects')

            setProjects(response.data)

            const userTasks = []
            response.data.forEach(project => {
                const projectTasks = Array.isArray(project.task) ? project.task : []
                projectTasks.forEach(task => {
                    if (task.assigned_to === user?.name || task.assigned_to === user?.email) {
                        userTasks.push({
                            ...task,
                            projectTitle: project.title,
                            projectId: project._id
                        })
                    }
                })
            })
            setMyTasks(userTasks)
        } catch (error) {
            console.error('Error fetching user data:', error)
            toast.error('Failed to load dashboard data')
        }
    }

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/login')
    }

    if (!user) return <div className="page-shell flex min-h-screen items-center justify-center text-[#3c4f42]">Loading...</div>

    const assignedProjects = projects.filter(p => {
        const members = Array.isArray(p.members) ? p.members : []
        return members.includes(user.name) || members.includes(user.email)
    })

    return (
        <div className="page-shell min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="surface-card fade-up overflow-hidden p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-[#be5828]">Dashboard</p>
                            <h1 className="mt-3 text-3xl font-semibold text-[#223228]">Welcome back, {user.name}</h1>
                            <p className="mt-2 text-[#5f7165]">Here is an overview of your active projects and tasks.</p>
                        </div>
                        <button onClick={handleLogout} className="inline-flex items-center justify-center rounded-2xl bg-[#d4511b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b84514]">Logout</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 xl:grid-cols-3">
                    <div className="surface-card fade-up stagger-1 p-6">
                        <p className="text-sm text-[#607367]">My Projects</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{assignedProjects.length}</p>
                        <p className="mt-3 text-sm text-[#607367]">Projects assigned to you.</p>
                    </div>
                    <div className="surface-card fade-up stagger-2 p-6">
                        <p className="text-sm text-[#607367]">My Tasks</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{myTasks.length}</p>
                        <p className="mt-3 text-sm text-[#607367]">Tasks currently assigned to you.</p>
                    </div>
                    <div className="surface-card fade-up stagger-3 p-6">
                        <p className="text-sm text-[#607367]">Completed Tasks</p>
                        <p className="mt-4 text-4xl font-semibold text-[#1f2f24]">{myTasks.filter(t => t.stage === 'Done').length}</p>
                        <p className="mt-3 text-sm text-[#607367]">Tasks finished by you.</p>
                    </div>
                </div>

                <section className="mt-8 grid gap-6 xl:grid-cols-2">
                    <div className="surface-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-[#1f2f24]">Assigned Projects</h2>
                                <p className="mt-1 text-sm text-[#607367]">Open a project to view its tasks and board.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigate('/')} className="rounded-2xl border border-[#c9d6bc] bg-[#f4f9ee] px-4 py-2 text-sm font-semibold text-[#2c3d32] transition hover:bg-[#edf5e2]">Browse all</button>
                            </div>
                        </div>
                        <div className="mt-6 space-y-4">
                            {assignedProjects.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-[#cfdac0] bg-[#f8fbf3] p-6 text-center text-sm text-[#607367]">No projects assigned yet.</div>
                            ) : (
                                assignedProjects.map((project) => (
                                    <div key={project._id} className="cursor-pointer rounded-3xl border border-[#d0dbc2] bg-[#f8fbf3] p-4 transition hover:-translate-y-0.5 hover:border-[#e4a688] hover:bg-white" onClick={() => navigate(`/${project._id}`)}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-[#1f2f24]">{project.title}</h3>
                                                <p className="mt-2 text-sm text-[#5f7165]">{project.description || 'No description available.'}</p>
                                            </div>
                                            <span className="rounded-2xl bg-[#fff1e9] px-3 py-1 text-xs font-semibold uppercase text-[#c35727]">{project.task?.length || 0} tasks</span>
                                        </div>
                                        <p className="mt-3 text-sm text-[#617367]">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="surface-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-[#1f2f24]">Quick Actions</h2>
                                <p className="mt-1 text-sm text-[#607367]">Navigate to essential workspace features.</p>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <button onClick={() => navigate('/')} className="rounded-2xl bg-[#0f9d90] px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b887d]">View Projects</button>
                            <button onClick={() => setProfileModalOpen(true)} className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]">Update Profile</button>
                            <button onClick={() => toast.info('Reports coming soon')} className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]">View Reports</button>
                            <button onClick={() => toast.info('Help center coming soon')} className="rounded-2xl border border-[#cfdac0] bg-white px-5 py-4 text-sm font-semibold text-[#2f4035] transition hover:-translate-y-0.5 hover:border-[#e3a184] hover:bg-[#fff8f3]">Help Center</button>
                        </div>
                    </div>
                </section>
            </div>

            <EditProfileModal isOpen={isProfileModalOpen} closeModal={() => setProfileModalOpen(false)} />
        </div>
    )
}

export default UserDashboard
