import React, { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import api from '../api'

const TaskModal = ({ isOpen, setIsOpen, id, projectTasks = [] }) => {
    const [taskData, setTaskData] = useState('')
    const [timeLogUser, setTimeLogUser] = useState('')
    const [timeLogStart, setTimeLogStart] = useState('')
    const [timeLogEnd, setTimeLogEnd] = useState('')

    const capitalizeFirstLetter = (value) => {
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
    }

    const fetchTask = () => {
        api.get(`/project/${id.projectId}/task/${id.id}`)
            .then((data) => {
                setTaskData({ ...data.data[0].task[0] })
            })
            .catch((error) => {
                console.error('Failed to fetch task:', error?.response?.data || error.message)
                toast.error('Something went wrong')
            })
    }

    useEffect(() => {
        if (isOpen) {
            fetchTask()
            setTimeLogUser('')
            setTimeLogStart('')
            setTimeLogEnd('')
        }
    }, [isOpen, id])

    const handleTimeLogSubmit = (e) => {
        e.preventDefault()
        api.post(`/project/${id.projectId}/task/${id.id}/time-log`, {
            user: timeLogUser || 'Unknown',
            started_at: timeLogStart,
            ended_at: timeLogEnd
        })
            .then(() => {
                toast.success('Time log added')
                setTimeLogUser('')
                setTimeLogStart('')
                setTimeLogEnd('')
                fetchTask()
            })
            .catch((error) => {
                console.error('Failed to add time log:', error?.response?.data || error.message)
                if (error?.response?.data?.message) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('Could not add time log')
                }
            })
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as='div' open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
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
                    <div className="fixed inset-0 flex h-screen w-screen items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="h-[85%] w-[88%] max-w-[88%] overflow-y-hidden rounded-3xl border border-[#d8e3c9] bg-white shadow-xl">
                                <Dialog.Title as='div' className={'sticky top-0 bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-6 py-4 text-white'}>
                                    <h1 className='font-semibold'>Task details</h1>
                                    <button onClick={() => setIsOpen(false)} className='absolute right-6 top-4 rounded text-white hover:bg-white/20 focus:outline-none focus:ring focus:ring-offset-1 focus:ring-white/40 '>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dialog.Title>
                                <div className='flex flex-col md:flex-row h-[inherit] gap-4 bg-[#f9fbf6] overflow-y-auto md:overflow-hidden'>
                                    <div className="min-h-max w-full md:w-8/12 space-y-3 px-6 md:px-8 py-4 md:overflow-y-auto">
                                        <h1 className='text-3xl font-semibold text-[#203127]'>{capitalizeFirstLetter(taskData.title)}</h1>
                                        <p className='text-[#5f7165]'>{capitalizeFirstLetter(taskData.description)}</p>
                                    </div>
                                    <div className="w-full md:w-4/12 px-6 md:px-0 md:pr-4 py-4 pb-8 md:overflow-y-auto">
                                        <div className='space-y-4'>
                                            <div className='rounded-2xl border border-[#cfdac1] bg-[#f7fbf2] p-4'>
                                                <h3 className='mb-3 font-semibold text-[#1f2f24]'>Details</h3>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Assigned to:</span> {taskData.assigned_to || 'Unassigned'}</p>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Created by:</span> {taskData.created_by || 'Unknown'}</p>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Updated by:</span> {taskData.updated_by || 'Unknown'}</p>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Status:</span> {taskData.stage || 'Requested'}</p>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Deadline:</span> {taskData.due_date ? new Date(taskData.due_date).toLocaleString() : 'Not set'}</p>
                                                <p className='text-sm text-[#5f7165]'><span className='font-medium'>Depends on:</span></p>
                                                <ul className='mt-2 space-y-1 text-sm text-[#5f7165]'>
                                                    {taskData.dependencies?.length > 0 ? taskData.dependencies.map((dep) => {
                                                        const dependencyTask = projectTasks.find((t) => t._id === dep || t._id === dep.toString())
                                                        return <li key={dep} className='rounded border border-[#d4deca] bg-white px-2 py-1'>{dependencyTask ? dependencyTask.title : dep}</li>
                                                    }) : <li className='rounded border border-[#d4deca] bg-white px-2 py-1'>None</li>}
                                                </ul>
                                            </div>
                                            <div className='rounded-2xl border border-[#cfdac1] bg-white p-4'>
                                                <h3 className='mb-3 font-semibold text-[#1f2f24]'>Activity</h3>
                                                {taskData.activity?.length > 0 ? (
                                                    <ul className='space-y-2 text-sm text-[#5f7165]'>
                                                        {taskData.activity.map((item, index) => (
                                                            <li key={index} className='rounded-md border border-[#d4deca] p-2'>
                                                                <p className='font-medium text-[#1f2f24]'>{item.event}</p>
                                                                <p className='text-xs text-[#6f8074]'>{item.user} - {new Date(item.timestamp).toLocaleString()}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className='text-sm text-[#6f8074]'>No activity yet.</p>
                                                )}
                                            </div>
                                            <div className='rounded-2xl border border-[#cfdac1] bg-white p-4'>
                                                <h3 className='mb-3 font-semibold text-[#1f2f24]'>Time logs</h3>
                                                {taskData.time_logs?.length > 0 ? (
                                                    <ul className='space-y-2 text-sm text-[#5f7165]'>
                                                        {taskData.time_logs.map((log, index) => (
                                                            <li key={index} className='rounded-md border border-[#d4deca] p-2'>
                                                                <p className='font-medium text-[#1f2f24]'>{log.user}</p>
                                                                <p className='text-xs text-[#6f8074]'>{new Date(log.started_at).toLocaleString()} - {new Date(log.ended_at).toLocaleString()}</p>
                                                                <p className='text-xs text-[#6f8074]'>Duration: {log.duration_minutes} min</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className='text-sm text-[#6f8074]'>No time logs yet.</p>
                                                )}
                                                <form onSubmit={handleTimeLogSubmit} className='mt-4 space-y-3'>
                                                    <div>
                                                        <label className='mb-1 block text-sm font-semibold text-[#33453a]'>User</label>
                                                        <input value={timeLogUser} onChange={(e) => setTimeLogUser(e.target.value)} placeholder='Name' className='fancy-input' />
                                                    </div>
                                                    <div>
                                                        <label className='mb-1 block text-sm font-semibold text-[#33453a]'>Start</label>
                                                        <input value={timeLogStart} onChange={(e) => setTimeLogStart(e.target.value)} type='datetime-local' className='fancy-input' />
                                                    </div>
                                                    <div>
                                                        <label className='mb-1 block text-sm font-semibold text-[#33453a]'>End</label>
                                                        <input value={timeLogEnd} onChange={(e) => setTimeLogEnd(e.target.value)} type='datetime-local' className='fancy-input' />
                                                    </div>
                                                    <button type='submit' className='w-full rounded-2xl bg-gradient-to-r from-[#e86a33] to-[#0f9d90] py-2 text-sm font-semibold text-white'>Add time log</button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default TaskModal
