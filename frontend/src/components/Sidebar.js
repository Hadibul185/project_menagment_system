import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import AddProjectModal from './AddProjectModal'
import api from '../api'

const navIcon = {
  Dashboard: 'M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z',
  Projects: 'M3 7h18M3 12h18M3 17h18',
  Tasks: 'M5 7h14M5 12h10M5 17h6',
  'Team Members': 'M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5zM8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z',
  Calendar: 'M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  Reports: 'M4 19h16M7 16V8M12 16V5M17 16v-3',
  Notifications: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  Settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9.4 4a7.8 7.8 0 00-.1-1l2.1-1.6-2-3.5-2.5 1a8 8 0 00-1.7-1l-.4-2.6h-4l-.4 2.6a8 8 0 00-1.7 1l-2.5-1-2 3.5 2.1 1.6a7.8 7.8 0 000 2L2.3 14.6l2 3.5 2.5-1a8 8 0 001.7 1l.4 2.6h4l.4-2.6a8 8 0 001.7-1l2.5 1 2-3.5-2.1-1.6c.1-.3.1-.7.1-1z'
}

const Sidebar = ({ onNavigate = () => {} }) => {
  const { user, logout, isAuthenticated, triggerAuth, pendingAction, clearPendingAction } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const [isProjectModalOpen, setProjectModalOpen] = useState(false)
  const [projects, setProjects] = useState([])

  const isProjectPath = /^\/[0-9a-fA-F]{24}$/.test(pathname)
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard'
  const tasksPath = isProjectPath ? pathname : '/'

  const items = [
    { label: 'Dashboard', to: dashboardPath, active: pathname === dashboardPath },
    { label: 'Projects', to: '/', active: pathname === '/' },
    { label: 'Tasks', to: tasksPath, active: isProjectPath },
    { label: 'Team Members', soon: true },
    { label: 'Calendar', soon: true },
    { label: 'Reports', soon: true },
    { label: 'Notifications', soon: true },
    { label: 'Settings', soon: true }
  ]

  const handleOpenProjectModal = useCallback(() => {
    if (!isAuthenticated) {
      triggerAuth({ type: 'addProject' })
      return
    }
    setProjectModalOpen(true)
  }, [isAuthenticated, triggerAuth])

  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'addProject') {
      setProjectModalOpen(true)
      clearPendingAction()
    }
  }, [isAuthenticated, pendingAction, clearPendingAction])

  const fetchProjects = useCallback(() => {
    api.get('/projects')
      .then((res) => setProjects(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error('Failed to load projects list:', error?.response?.data || error.message)
        setProjects([])
      })
  }, [])

  useEffect(() => {
    fetchProjects()
    const handleProjectUpdate = () => fetchProjects()
    document.addEventListener('projectUpdate', handleProjectUpdate)

    return () => {
      document.removeEventListener('projectUpdate', handleProjectUpdate)
    }
  }, [fetchProjects])

  const handleComingSoonClick = (itemName) => {
    toast(itemName + ' is coming soon')
    onNavigate()
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    onNavigate()
    navigate('/login')
  }

  const closeProjectModal = () => {
    setProjectModalOpen(false)
  }

  return (
    <>
      <div className='surface-card fade-up h-full overflow-hidden px-4 py-5'>
        <div className='mb-5 rounded-2xl border border-[#dfe8d0] bg-[#f4f8ed] px-4 py-4'>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-[#607466]'>Workspace</p>
          <h2 className='mt-2 text-lg font-semibold text-[#223228]'>Navigation Menu</h2>
          <p className='mt-1 text-sm text-[#617468]'>All core workspace sections in one place.</p>
          {user?.role === 'admin' && (
            <button
              type='button'
              onClick={handleOpenProjectModal}
              className='mt-4 w-full rounded-2xl bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(232,106,51,0.24)] transition hover:brightness-110'
            >
              + Create Project
            </button>
          )}
        </div>

        <div className='max-h-[58vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[56vh]'>
          {items.map((item, idx) => {
            const iconPath = navIcon[item.label]
            const itemBody = (
              <>
                <span className='flex h-8 w-8 items-center justify-center rounded-xl bg-white/70'>
                  <svg className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d={iconPath} />
                  </svg>
                </span>
                <span className='flex-1'>{item.label}</span>
                {item.soon && (
                  <span className='rounded-full border border-[#f2c7b0] bg-[#fff4ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#bf5828]'>
                    Soon
                  </span>
                )}
              </>
            )

            if (item.soon) {
              return (
                <button
                  key={item.label}
                  type='button'
                  onClick={() => handleComingSoonClick(item.label)}
                  className={`nav-pill fade-up stagger-${Math.min(3, idx + 1)} flex items-center gap-3 text-left`}
                >
                  {itemBody}
                </button>
              )
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onNavigate}
                className={`nav-pill fade-up stagger-${Math.min(3, idx + 1)} flex items-center gap-3 ${item.active ? 'nav-pill-active' : ''}`}
              >
                {itemBody}
              </Link>
            )
          })}

          <div className='mt-4 rounded-2xl border border-[#dfe8d0] bg-[#f8fbf4] p-3'>
            <p className='text-xs font-bold uppercase tracking-[0.16em] text-[#607466]'>Your Projects</p>
            <div className='mt-2 space-y-2'>
              {projects.length === 0 ? (
                <div className='rounded-xl border border-dashed border-[#ced9bf] bg-white px-3 py-2 text-xs text-[#5f7165]'>
                  No projects yet.
                </div>
              ) : (
                projects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/${project._id}`}
                    onClick={onNavigate}
                    className='block rounded-xl border border-[#d2ddc4] bg-white px-3 py-2 text-sm font-medium text-[#28382e] transition hover:border-[#e2a487] hover:bg-[#fff7f2]'
                  >
                    <p className='truncate'>{project.title}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <button
            type='button'
            onClick={handleLogout}
            className='mt-5 flex w-full items-center justify-center rounded-2xl border border-[#f4b39a] bg-[#fff2eb] px-4 py-3 text-sm font-bold text-[#c55423] transition hover:-translate-y-0.5 hover:bg-[#ffe8dd]'
          >
            Logout
          </button>
        )}
      </div>

      <AddProjectModal isModalOpen={isProjectModalOpen} closeModal={closeProjectModal} />
    </>
  )
}

export default Sidebar
