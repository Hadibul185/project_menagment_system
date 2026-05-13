import React, { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import BtnPrimary from './BtnPrimary'
import BtnSecondary from './BtnSecondary'
import toast from 'react-hot-toast'
import api from '../api'

const AddTaskModal = ({ isAddTaskModalOpen, setAddTaskModal, projectId = null, taskId = null, edit = false, refreshData, projectTasks = [] }) => {

    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [createdBy, setCreatedBy] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [dependencies, setDependencies] = useState([])

    useEffect(() => {
        if (edit && isAddTaskModalOpen) {
            api.get(`/project/${projectId}/task/${taskId}`)
                .then((res) => {
                    const task = res.data[0].task[0]
                    setTitle(task.title)
                    setDesc(task.description)
                    setAssignedTo(task.assigned_to || '')
                    setCreatedBy(task.created_by || '')
                    setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '')
                    setDependencies(task.dependencies?.map((id) => id.toString()) || [])
                })
                .catch((error) => {
                    console.error('Failed to fetch task details:', error?.response?.data || error.message)
                    toast.error('Something went wrong')
                })
        } else if (!isAddTaskModalOpen) {
            setTitle('')
            setDesc('')
            setAssignedTo('')
            setCreatedBy('')
            setDueDate('')
            setDependencies([])
        }
    }, [isAddTaskModalOpen]);

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            title,
            description: desc,
            assigned_to: assignedTo,
            updated_by: createdBy || assignedTo || 'System',
            due_date: dueDate || null,
            dependencies
        }
        if (!edit) {
            api.post(`/project/${projectId}/task`, {
                ...payload,
                created_by: createdBy || 'System'
            })
                .then((res) => {
                    setAddTaskModal(false)
                    toast.success('Task created successfully')
                    setTitle('')
                    setDesc('')
                    setAssignedTo('')
                    setCreatedBy('')
                    setDueDate('')
                    setDependencies([])
                    refreshData?.(true)
                })
                .catch((error) => {
                    console.error('Failed to create task:', error?.response?.data || error.message)
                    if (error?.response?.status === 422) {
                        toast.error(error.response.data.details[0]?.message || 'Validation failed')
                    } else {
                        toast.error('Something went wrong')
                    }
                })
        } else {
            api.put(`/project/${projectId}/task/${taskId}`, payload)
                .then((res) => {
                    setAddTaskModal(false)
                    toast.success('Task is updated')
                    refreshData?.(true)
                    setTitle('')
                    setDesc('')
                    setAssignedTo('')
                    setCreatedBy('')
                    setDueDate('')
                    setDependencies([])
                })
                .catch((error) => {
                    console.error('Failed to update task:', error?.response?.data || error.message)
                    if (error?.response?.status === 422) {
                        toast.error(error.response.data.details[0]?.message || 'Validation failed')
                    } else {
                        toast.error('Something went wrong')
                    }
                })
        }
    }

    return (
        <Transition appear show={isAddTaskModalOpen} as={Fragment}>
            <Dialog as='div' open={isAddTaskModalOpen} onClose={() => setAddTaskModal(false)} className="relative z-50">
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
                            <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#d8e3c9] bg-white">

                                <Dialog.Title as='div' className={'sticky top-0 bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white'}>
                                    {!edit ? (<h1>Add Task</h1>) : (<h1>Edit Task</h1>)}
                                    <button onClick={() => setAddTaskModal(false)} className='absolute right-6 top-4 rounded text-white hover:bg-white/20 focus:outline-none focus:ring focus:ring-offset-1 focus:ring-white/40 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <form onSubmit={handleSubmit} className='gap-4 bg-white/95 px-8 py-5'>
                                    <div className='mb-3'>
                                        <label htmlFor="title" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Title</label>
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className='fancy-input' placeholder='Task title' />
                                    </div>
                                    <div className='mb-2'>
                                        <label htmlFor="Description" className='mb-2 block text-sm font-semibold text-[#2f4035]'>Description</label>
                                        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className='fancy-input resize-none' rows="6" placeholder='Task description'></textarea>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4 mb-3'>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Created By</label>
                                            <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} type="text" className='fancy-input' placeholder='Creator name' />
                                        </div>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Assigned To</label>
                                            <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} type="text" className='fancy-input' placeholder='Assignee' />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4 mb-3'>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Deadline</label>
                                            <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="datetime-local" className='fancy-input' />
                                        </div>
                                        <div>
                                            <label className='mb-2 block text-sm font-semibold text-[#2f4035]'>Dependencies</label>
                                            <select value={dependencies} onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))} multiple className='fancy-input h-32'>
                                                {projectTasks.filter((task) => task._id !== taskId).map((task) => (
                                                    <option key={task._id} value={task._id}>{task.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className='flex justify-end items-center space-x-2'>
                                        <BtnSecondary onClick={() => setAddTaskModal(false)}>Cancel</BtnSecondary>
                                        <BtnPrimary>Save</BtnPrimary>
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

export default AddTaskModal
