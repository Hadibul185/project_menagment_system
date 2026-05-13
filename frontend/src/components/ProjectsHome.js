import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AddProjectModal from './AddProjectModal'
import BtnPrimary from './BtnPrimary'
import BtnSecondary from './BtnSecondary'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

const ProjectsHome = () => {
  const { isAuthenticated, triggerAuth, pendingAction, clearPendingAction } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isModalOpen, setModalOpen] = useState(false)

  const fetchProjects = useCallback(() => {
    api.get('/projects')
      .then((res) => setProjects(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error('Failed to load projects:', error?.response?.data || error.message)
        toast.error('Failed to load projects')
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

  useEffect(() => {
    if (isAuthenticated && (pendingAction?.type === 'addProject' || pendingAction?.type === 'createProject')) {
      setModalOpen(true)
      clearPendingAction()
    }
  }, [isAuthenticated, pendingAction, clearPendingAction])

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      triggerAuth({ type: 'addProject' })
      return
    }
    setModalOpen(true)
  }

  return (
    <>
      <div className='surface-card fade-up p-6 sm:p-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm uppercase tracking-[0.2em] text-[#be5828]'>Projects</p>
            <h1 className='mt-2 text-3xl font-semibold text-[#223228]'>All Projects</h1>
            <p className='mt-2 text-sm text-[#607367]'>Open any project board or create a new one.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <BtnSecondary onClick={fetchProjects}>Refresh</BtnSecondary>
            <BtnPrimary onClick={handleOpenCreate}>+ Create Project</BtnPrimary>
          </div>
        </div>
      </div>

      <section className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {projects.length === 0 ? (
          <div className='surface-card col-span-full p-8 text-center'>
            <p className='text-lg font-semibold text-[#2a3a30]'>No projects found</p>
            <p className='mt-2 text-sm text-[#607367]'>Create your first project to start organizing tasks.</p>
            <div className='mt-4'>
              <BtnPrimary onClick={handleOpenCreate}>Create Project</BtnPrimary>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <button
              key={project._id}
              type='button'
              onClick={() => navigate(`/${project._id}`)}
              className='surface-card text-left p-5 transition hover:-translate-y-0.5 hover:border-[#e4a688]'
            >
              <div className='flex items-start justify-between gap-3'>
                <h2 className='text-lg font-semibold text-[#1f2f24]'>{project.title}</h2>
                <span className='rounded-full bg-[#fff1e9] px-3 py-1 text-xs font-semibold text-[#c35727]'>
                  {(project.task || []).length} tasks
                </span>
              </div>
              <p className='mt-2 text-sm text-[#5f7165]'>{project.description || 'No description available.'}</p>
              <p className='mt-3 text-xs text-[#6d7f72]'>
                Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}
              </p>
            </button>
          ))
        )}
      </section>

      <AddProjectModal isModalOpen={isModalOpen} closeModal={() => setModalOpen(false)} />
    </>
  )
}

export default ProjectsHome
