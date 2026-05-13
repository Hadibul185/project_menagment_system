import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { v4 as uuid } from "uuid";
import AddTaskModal from "./AddTaskModal";
import BtnPrimary from './BtnPrimary'
import DropdownMenu from "./DropdownMenu";
// import TaskModal from "./TaskModal";
import { useParams, useNavigate } from "react-router";
import ProjectDropdown from "./ProjectDropdown"
import { useAuth } from '../contexts/AuthContext';
import toast from "react-hot-toast";
import TaskModal from "./TaskModal";
import api from '../api'


function Task() {

    const { user, isAuthenticated, triggerAuth } = useAuth();
    const navigate = useNavigate();
    //     { _id: uuid(), content: "First task" },
    //     { _id: uuid(), content: "Second task" },
    //     { _id: uuid(), content: "Third task" },
    //     { _id: uuid(), content: "Forth task" }
    // ];

    // const columnsFromBackend = {
    //     [uuid()]: {
    //         name: "Requested",
    //         items: []
    //     },
    //     [uuid()]: {
    //         name: "To do",
    //         items: []
    //     },
    //     [uuid()]: {
    //         name: "In Progress",
    //         items: []
    //     },
    //     [uuid()]: {
    //         name: "Done",
    //         items: []
    //     }
    // };

    const onDragEnd = (result, columns, setColumns) => {
        if (!isAuthenticated) {
            triggerAuth({ type: 'modifyTask' });
            return;
        }

        if (!result.destination) return;
        const { source, destination } = result;
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];

        if (user?.role !== 'admin' && (sourceColumn.name === 'Requested' || destColumn.name === 'Requested')) {
            toast.error('Only admins can approve requested tasks.');
            return;
        }

        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);

        if (source.droppableId !== destination.droppableId) {
            destItems.splice(destination.index, 0, removed);
            const updated = {
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems },
                [destination.droppableId]: { ...destColumn, items: destItems }
            };
            setColumns(updated);
            updateTodo(updated);
        } else {
            sourceItems.splice(destination.index, 0, removed);
            const updated = {
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems }
            };
            setColumns(updated);
            updateTodo(updated);
        }
    };

    const [isAddTaskModalOpen, setAddTaskModal] = useState(false);

    // const [columns, setColumns] = useState(columnsFromBackend);
    const [columns, setColumns] = useState({});
    const [allTasks, setAllTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isRenderChange, setRenderChange] = useState(false);
    const [isTaskOpen, setTaskOpen] = useState(false);
    const [taskId, setTaskId] = useState(false);
    const [title, setTitle] = useState('');
    const { projectId } = useParams();

    useEffect(() => {
        if (!isAddTaskModalOpen || isRenderChange) {
            api.get(`/project/${projectId}`)
                .then((res) => {
                    const project = res.data[0];
                    setTitle(project.title)
                    setAllTasks(project.task)
                    setColumns({
                        [uuid()]: {
                            name: "Requested",
                            items: project.task.filter((task) => task.stage === "Requested").sort((a, b) => a.order - b.order)
                        },
                        [uuid()]: {
                            name: "To do",
                            items: project.task.filter((task) => task.stage === "To do").sort((a, b) => a.order - b.order)
                        },
                        [uuid()]: {
                            name: "In Progress",
                            items: project.task.filter((task) => task.stage === "In Progress").sort((a, b) => a.order - b.order)
                        },
                        [uuid()]: {
                            name: "Done",
                            items: project.task.filter((task) => task.stage === "Done").sort((a, b) => a.order - b.order)
                        }
                    })

                    const now = new Date();
                    const nextDay = 24 * 60 * 60 * 1000;
                    const notifications = [];

                    project.task.forEach((task) => {
                        if (task.due_date) {
                            const dueDate = new Date(task.due_date)
                            if (dueDate > now && dueDate - now <= nextDay && task.stage !== 'Done') {
                                notifications.push({ type: 'deadline', message: `Deadline soon: ${task.title}` })
                            }
                        }
                        if (task.assigned_to) {
                            notifications.push({ type: 'assigned', message: `Assigned to ${task.assigned_to}: ${task.title}` })
                        }
                        if (task.dependencies?.length > 0 && task.stage !== 'Done') {
                            const blocked = task.dependencies.some((dependencyId) => {
                                const dependencyTask = project.task.find((t) => t._id === dependencyId)
                                return !dependencyTask || dependencyTask.stage !== 'Done'
                            })
                            if (blocked) {
                                notifications.push({ type: 'blocked', message: `Blocked by dependencies: ${task.title}` })
                            }
                        }
                    })

                    setNotifications(notifications)
                    setRenderChange(false)
                }).catch(() => {
                    console.error('Failed to load project board')
                    toast.error('Something went wrong')
                })
        }
    }, [projectId, isAddTaskModalOpen, isRenderChange]);

    const updateTodo = (data) => {
        api.put(`/project/${projectId}/todo`, data).catch((error) => {
            console.error('Failed to update board status:', error?.response?.data || error.message)
            toast.error('Something went wrong')
        })
    }

    const handleDelete = (e, taskId) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to delete tasks');
            navigate('/login');
            return;
        }

        api.delete(`/project/${projectId}/task/${taskId}`)
            .then((res) => {
                toast.success('Task is deleted')
                setRenderChange(true)
            }).catch((error) => {
                console.error('Failed to delete task:', error?.response?.data || error.message)
                toast.error('Something went wrong')
            })
    }

    const handleTaskDetails = (id) => {
        setTaskId({ projectId, id });
        setTaskOpen(true);
    }

    return (
        <div className='w-full fade-up'>
            <div className="surface-card mb-8 p-6">
                <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                        <p className='text-sm uppercase tracking-[0.2em] text-[#be5828]'>Project Board</p>
                        <h1 className='mt-2 text-2xl font-semibold text-[#1f2f24]'>{title || 'Project Board'}</h1>
                        <p className='mt-2 text-sm text-[#607367]'>Drag and drop tasks to update progress and keep delivery momentum visible to everyone.</p>
                    </div>
                    <div className='flex flex-wrap gap-3 items-center'>
                        <BtnPrimary onClick={() => {
                            if (!isAuthenticated) {
                                triggerAuth({ type: 'addTask' });
                            } else {
                                setAddTaskModal(true);
                            }
                        }} className='py-3 px-5'>{user?.role === 'admin' ? 'Add task' : 'Request Task'}</BtnPrimary>
                        {isAuthenticated && user?.role === 'admin' && <ProjectDropdown id={projectId} navigate={navigate} />}
                    </div>
                </div>

                {notifications.length > 0 && (
                    <div className='surface-card-soft mt-6 p-4'>
                        <h2 className='mb-3 text-sm font-semibold text-[#1f2f24]'>Updates</h2>
                        <div className='grid gap-3 sm:grid-cols-2'>
                            {notifications.map((notification, index) => (
                                <div key={index} className='rounded-3xl border border-[#cdd8bf] bg-white p-4 text-sm text-[#607367] shadow-sm'>
                                    <p className='font-medium uppercase tracking-[0.09em] text-[#324338]'>{notification.type.replace('-', ' ')}</p>
                                    <p className='mt-1'>{notification.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <DragDropContext onDragEnd={result => onDragEnd(result, columns, setColumns)}>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <div key={columnId} className="surface-card-soft min-h-[620px] p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#33453a]">{column.name}</h2>
                                    <p className="mt-1 text-xs text-[#607367]">{column.items.length} tasks</p>
                                </div>
                                <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[#fff0e8] px-3 text-xs font-semibold text-[#c75a2a]">{column.items.length}</span>
                            </div>
                            <Droppable droppableId={columnId} key={columnId}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`min-h-[520px] space-y-3 rounded-[24px] border border-dashed p-2 transition ${snapshot.isDraggingOver ? 'border-[#f0b293] bg-[#fff4ee]' : 'border-[#d5dfc7] bg-white/70'}`}
                                    >
                                        {column.items.map((item, index) => (
                                            <Draggable key={item._id} draggableId={item._id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{ ...provided.draggableProps.style }}
                                                        onClick={() => handleTaskDetails(item._id)}
                                                        className={`group relative rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${snapshot.isDragging ? 'border-[#e0a183] opacity-95 shadow-lg' : 'border-[#d1dbc3] opacity-100 hover:border-[#e0a183]'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <h3 className="text-sm font-semibold text-[#1f2f24]">{item.title}</h3>
                                                            <DropdownMenu taskId={item._id} handleDelete={handleDelete} projectId={projectId} setRenderChange={setRenderChange} projectTasks={allTasks} />
                                                        </div>
                                                        <p className="mt-3 text-sm leading-6 text-[#5f7165]">{item.description?.slice(0, 90) || 'No description provided.'}</p>
                                                        <div className="mt-4 flex flex-wrap gap-2 items-center text-xs">
                                                            <span className="rounded-full bg-[#eef4e5] px-3 py-1 text-[#3f5246]">{item.assigned_to || 'Unassigned'}</span>
                                                            <span className="rounded-full bg-[#ebfbf8] px-3 py-1 text-[#11786f]">{item.stage}</span>
                                                            {item.due_date && <span className="rounded-full bg-[#fff1e9] px-3 py-1 text-[#c55526]">Due {new Date(item.due_date).toLocaleDateString()}</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            <AddTaskModal isAddTaskModalOpen={isAddTaskModalOpen} setAddTaskModal={setAddTaskModal} projectId={projectId} projectTasks={allTasks} refreshData={() => setRenderChange(true)} />
            <TaskModal isOpen={isTaskOpen} setIsOpen={setTaskOpen} id={taskId} projectTasks={allTasks} />
        </div>
    );
}

export default Task;
