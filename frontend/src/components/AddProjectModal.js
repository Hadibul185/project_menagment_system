import React, { Fragment, memo, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import BtnPrimary from './BtnPrimary'
import BtnSecondary from './BtnSecondary'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

const AddProjectModal = ({ isModalOpen, closeModal, edit = false, id = null }) => {
    const { user, isAuthenticated, triggerAuth } = useAuth()

    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('');
    const [deadline, setDeadline] = useState('');
    const [members, setMembers] = useState('');
    const [createdBy, setCreatedBy] = useState(user?.name || '');

    useEffect(() => {
        if (edit && isModalOpen) {
            if (!isAuthenticated) {
                triggerAuth({ type: 'editProject', projectId: id })
                return
            }
            api.get(`/project/${id}`)
                .then((res) => {
                    setTitle(res.data[0].title)
                    setDesc(res.data[0].description)
                    setDeadline(res.data[0].deadline ? new Date(res.data[0].deadline).toISOString().slice(0, 16) : '')
                    setMembers(res.data[0].members ? res.data[0].members.join(', ') : '')
                    setCreatedBy(res.data[0].created_by || user?.name || '')
                })
                .catch((error) => {
                    const message = error?.response?.data?.message || error?.message || 'Failed to load project'
                    toast.error(message)
                })
        } else if (!isModalOpen) {
            setTitle('')
            setDesc('')
            setDeadline('')
            setMembers('')
            setCreatedBy(user?.name || '')
        }
    }, [isModalOpen, user, isAuthenticated, id, triggerAuth]);


    const handleSubmit = (e) => {
        e.preventDefault()
        
        // Check authentication before proceeding
        if (!isAuthenticated) {
            const actionType = edit ? 'editProject' : 'createProject'
            triggerAuth({ 
                type: actionType, 
                projectId: id,
                projectData: {
                    title,
                    description: desc,
                    deadline,
                    members
                }
            })
            return
        }

        const membersList = members 
            ? members
                .split(',')
                .map(m => m.trim())
                .filter(m => m && m.length > 0)
            : []

        const payload = {
            title,
            description: desc,
            deadline: deadline || null,
        }

        // Only include members if they are provided
        if (membersList.length > 0) {
            payload.members = membersList
        }

        if (!edit) {
            payload.created_by = user?.name || ''
            api.post('/project/', payload)
                .then((res) => {
                    closeModal()
                    const customEvent = new CustomEvent('projectUpdate', { detail: { ...res.data } });
                    document.dispatchEvent(customEvent);
                    toast.success('Project created successfully')
                    setTitle('')
                    setDesc('')
                    setDeadline('')
                    setMembers('')
                })
                .catch((error) => {
                    const message = error?.response?.data?.details?.[0]?.message
                        || error?.response?.data?.data?.message
                        || error?.response?.data?.message
                        || error?.message
                        || 'Failed to create project'
                    toast.error(message)
                })
        } else {
            api.put(`/project/${id}`, payload)
                .then((res) => {
                    closeModal()
                    const customEvent = new CustomEvent('projectUpdate', { detail: { ...res.data } });
                    document.dispatchEvent(customEvent);
                    toast.success('Project updated successfully')
                    setTitle('')
                    setDesc('')
                    setDeadline('')
                    setMembers('')
                })
                .catch((error) => {
                    const message = error?.response?.data?.details?.[0]?.message
                        || error?.response?.data?.data?.message
                        || error?.response?.data?.message
                        || error?.message
                        || 'Failed to update project'
                    toast.error(message)
                })
        }

    }

    return (
        <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as='div' open={isModalOpen} onClose={() => closeModal()} className="relative z-50">
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
                    <div className="fixed inset-0 flex items-center justify-center p-4 w-screen h-screen ">
                        {/* <div className="fixed inset-0 "> */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300 "
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl mx-4 overflow-hidden rounded-3xl border border-[#d8e3c9] bg-white shadow-xl">

                                <Dialog.Title as='div' className={'bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white flex items-center justify-between'}>
                                    <h1 className="text-xl font-semibold">{edit ? 'Edit Project' : 'Create New Project'}</h1>
                                    <button onClick={() => closeModal()} className='text-white hover:bg-white/20 rounded-full p-1 focus:outline-none focus:ring focus:ring-white/50'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className='space-y-6 bg-white/95 p-6'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                        <div className='md:col-span-2'>
                                            <label htmlFor="title" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Project Title</label>
                                            <input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                type="text"
                                                className='fancy-input'
                                                placeholder='Enter project title'
                                                required
                                            />
                                        </div>
                                        <div className='md:col-span-2'>
                                            <label htmlFor="description" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Description</label>
                                            <textarea
                                                value={desc}
                                                onChange={(e) => setDesc(e.target.value)}
                                                className='fancy-input resize-none'
                                                rows="4"
                                                placeholder='Describe your project'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="deadline" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Deadline</label>
                                            <input
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                type="datetime-local"
                                                className='fancy-input'
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="members" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Team Members</label>
                                            <input
                                                value={members}
                                                onChange={(e) => setMembers(e.target.value)}
                                                type="text"
                                                className='fancy-input'
                                                placeholder='John, Jane, Bob (comma separated)'
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="created_by" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Created By</label>
                                            <input
                                                value={createdBy}
                                                type="text"
                                                className='fancy-input cursor-not-allowed bg-[#f5f9ef] text-[#708176]'
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className='flex items-center justify-end space-x-3 border-t border-[#dde8ce] pt-4'>
                                        <BtnSecondary onClick={() => closeModal()}>Cancel</BtnSecondary>
                                        <BtnPrimary type="submit">{edit ? 'Update Project' : 'Create Project'}</BtnPrimary>
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

export default memo(AddProjectModal)
