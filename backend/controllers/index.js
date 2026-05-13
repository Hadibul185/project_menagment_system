import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Project, { User } from '../models/index.js'

// ─── Helper ───────────────────────────────────────────────────────────────────
const toObjectId = (id) => new mongoose.Types.ObjectId(id)

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set')


// ═════════════════════════════════════════════════════════════════════════════
//  AUTH CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

export const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        const existing = await User.findOne({ email })
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        }).save()

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        return res.status(201).json({
            message: 'User created successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        if ((user.role === 'admin' || user.role === 'superadmin') && !user.isAdminVerified) {
            const code = Math.floor(100000 + Math.random() * 900000).toString()
            user.loginVerificationCode = code
            await user.save()
            console.log(`\n🔑 ADMIN ACCESS CODE for ${user.email}: ${code}\n`)
            return res.status(202).json({
                message: 'Verification required',
                requires_code: true,
                email: user.email
            })
        }

        // Update last login timestamp
        user.lastLogin = new Date()
        await user.save()

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        return res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const verifyLogin = async (req, res) => {
    try {
        const { email, code } = req.body
        const user = await User.findOne({ email })
        if (!user || !user.loginVerificationCode || user.loginVerificationCode !== code) {
            return res.status(401).json({ message: 'Invalid verification code' })
        }

        user.isAdminVerified = true
        user.loginVerificationCode = null
        user.lastLogin = new Date()
        await user.save()

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        return res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }
        return res.json({ user })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (email !== user.email) {
            const existing = await User.findOne({ email })
            if (existing) {
                return res.status(409).json({ message: 'Email already in use' })
            }
            user.email = email
        }

        if (name) user.name = name
        if (password) {
            user.password = await bcrypt.hash(password, 10)
        }

        await user.save()

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        return res.json({
            message: 'Profile updated successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token
        })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -loginVerificationCode')
            .sort({ createdAt: -1 })
        return res.json(users)
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body

        if (role === 'superadmin') {
            const count = await User.countDocuments({ role: 'superadmin' })
            if (count >= 2) {
                return res.status(400).json({ message: 'Maximum of 2 superadmins allowed.' })
            }
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (req.user.id === req.params.id && role !== req.user.role) {
            return res.status(400).json({ message: 'You cannot demote yourself.' })
        }

        if (req.user.role !== 'superadmin' && (user.role === 'admin' || user.role === 'superadmin') && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'You cannot modify another admin or superadmin.' })
        }

        user.role = role
        await user.save()

        return res.json({ message: 'User role updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'You cannot delete yourself.' })
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (req.user.role !== 'superadmin' && (user.role === 'admin' || user.role === 'superadmin')) {
            return res.status(403).json({ message: 'You cannot delete another admin or superadmin.' })
        }

        await User.findByIdAndDelete(req.params.id)

        return res.json({ message: 'User deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}


// ═════════════════════════════════════════════════════════════════════════════
//  PROJECT CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

export const getAllProjects = async (req, res) => {
    try {
        if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
            const projects = await Project.find({}).sort({ createdAt: -1 })
            return res.json(projects)
        } else {
            const data = await Project.find({}, { task: 0, __v: 0, updatedAt: 0 })
            return res.json(data)
        }
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const getProjectById = async (req, res) => {
    try {
        const data = await Project.find({ _id: toObjectId(req.params.id) }).sort({ order: 1 })
        if (!data.length) {
            return res.status(404).json({ message: 'Project not found' })
        }
        return res.json(data)
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const createProject = async (req, res) => {
    try {
        const { title, description, deadline, teamMembers, members, createdBy, created_by } = req.body

        // Handle both 'members' (from frontend) and 'teamMembers' (legacy)
        const membersList = members || teamMembers
        const processedMembers = Array.isArray(membersList)
            ? membersList.map((m) => m.trim()).filter(Boolean)
            : typeof membersList === 'string'
                ? membersList.split(',').map((m) => m.trim()).filter(Boolean)
                : []

        const creator = createdBy || created_by || req.user?.name || req.user?.email || 'Unknown'

        const data = await new Project({
            title,
            description,
            deadline: deadline || undefined,
            members: processedMembers,
            created_by: creator
        }).save()

        return res.status(201).json({
            message: 'Project created successfully',
            data: {
                _id:         data._id,
                title:       data.title,
                description: data.description,
                deadline:    data.deadline,
                members:     data.members,
                created_by:  data.created_by,
                createdAt:   data.createdAt,
                updatedAt:   data.updatedAt
            }
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(422).json({ message: 'Project title already exists' })
        }
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const updateProject = async (req, res) => {
    try {
        const { title, description, deadline, members } = req.body

        const data = await Project.updateOne(
            { _id: toObjectId(req.params.id) },
            {
                title,
                description,
                deadline: deadline ? new Date(deadline) : null,
                members:  Array.isArray(members) ? members : []
            },
            { upsert: true }
        )

        if (data.matchedCount === 0 && data.upsertedCount === 0) {
            return res.status(404).json({ message: 'Project not found' })
        }

        return res.json({ message: 'Project updated successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const deleteProject = async (req, res) => {
    try {
        const data = await Project.deleteOne({ _id: toObjectId(req.params.id) })
        if (data.deletedCount === 0) {
            return res.status(404).json({ message: 'Project not found' })
        }
        return res.json({ message: 'Project deleted successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}


// ═════════════════════════════════════════════════════════════════════════════
//  TASK CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

export const createTask = async (req, res) => {
    try {
        const { title, description, assigned_to, created_by, updated_by, due_date, dependencies } = req.body

        const project = await Project.findOne(
            { _id: toObjectId(req.params.id) },
            { 'task.index': 1 }
        )
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        const tasks     = project.task || []
        const taskCount = tasks.length
        const maxIndex  = taskCount > 0 ? Math.max(...tasks.map((t) => t.index)) : 0

        const resolvedDependencies = Array.isArray(dependencies)
            ? dependencies.map((id) => toObjectId(id))
            : []

        const today = new Date()

        const data = await Project.updateOne(
            { _id: toObjectId(req.params.id) },
            {
                $push: {
                    task: {
                        title,
                        description,
                        dependencies:  resolvedDependencies,
                        assigned_to:   assigned_to  || '',
                        created_by:    created_by   || req.user?.name || 'System',
                        updated_by:    updated_by   || created_by || req.user?.name || 'System',
                        due_date:      due_date ? new Date(due_date) : undefined,
                        stage:         'Requested',
                        order:         taskCount,
                        index:         maxIndex + 1,
                        activity:      [{ event: 'Task created', user: created_by || 'System', timestamp: today }],
                        notifications: [],
                        created_at:    today,
                        updated_at:    today
                    }
                }
            }
        )

        return res.status(201).json({ message: 'Task created successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const getTaskById = async (req, res) => {
    try {
        const data = await Project.find(
            { _id: toObjectId(req.params.id) },
            {
                task: {
                    $filter: {
                        input: '$task',
                        as:    'task',
                        cond:  { $in: ['$$task._id', [toObjectId(req.params.taskId)]] }
                    }
                }
            }
        )

        if (!data.length || data[0].task.length < 1) {
            return res.status(404).json({ message: 'Task not found' })
        }

        return res.json(data)
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const updateTask = async (req, res) => {
    try {
        const { title, description, assigned_to, updated_by, due_date, dependencies } = req.body

        const data = await Project.updateOne(
            {
                _id:  toObjectId(req.params.id),
                task: { $elemMatch: { _id: toObjectId(req.params.taskId) } }
            },
            {
                $set: {
                    'task.$.title':        title,
                    'task.$.description':  description,
                    'task.$.assigned_to':  assigned_to || '',
                    'task.$.updated_by':   updated_by  || req.user?.name || 'System',
                    'task.$.updated_at':   new Date(),
                    'task.$.due_date':     due_date ? new Date(due_date) : null,
                    'task.$.dependencies': Array.isArray(dependencies)
                        ? dependencies.map((id) => toObjectId(id))
                        : []
                },
                $push: {
                    'task.$.activity': {
                        event:     'Task details updated',
                        user:      updated_by || req.user?.name || 'System',
                        timestamp: new Date()
                    }
                }
            }
        )

        if (data.matchedCount === 0) {
            return res.status(404).json({ message: 'Task not found' })
        }

        return res.json({ message: 'Task updated successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export const deleteTask = async (req, res) => {
    try {
        const data = await Project.updateOne(
            { _id: toObjectId(req.params.id) },
            { $pull: { task: { _id: toObjectId(req.params.taskId) } } }
        )

        if (data.matchedCount === 0) {
            return res.status(404).json({ message: 'Project not found' })
        }

        return res.json({ message: 'Task deleted successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}


// ═════════════════════════════════════════════════════════════════════════════
//  TIME LOG CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export const addTimeLog = async (req, res) => {
    try {
        const { user, started_at, ended_at } = req.body

        const start = new Date(started_at)
        const end   = new Date(ended_at)

        if (end <= start) {
            return res.status(422).json({ message: 'End time must be after start time' })
        }

        const duration = Math.round((end - start) / 60000)

        const data = await Project.updateOne(
            {
                _id:  toObjectId(req.params.id),
                task: { $elemMatch: { _id: toObjectId(req.params.taskId) } }
            },
            {
                $push: {
                    'task.$.time_logs': {
                        user:             user || req.user?.name || 'Unknown',
                        started_at:       start,
                        ended_at:         end,
                        duration_minutes: duration
                    },
                    'task.$.activity': {
                        event:     'Time log added',
                        user:      user || req.user?.name || 'Unknown',
                        timestamp: new Date()
                    }
                },
                $set: {
                    'task.$.updated_at': new Date(),
                    'task.$.updated_by': user || req.user?.name || 'Unknown'
                }
            }
        )

        if (data.matchedCount === 0) {
            return res.status(404).json({ message: 'Task not found' })
        }

        return res.json({ message: 'Time log added successfully', data })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}


// ═════════════════════════════════════════════════════════════════════════════
//  KANBAN / TODO CONTROLLER
// ═════════════════════════════════════════════════════════════════════════════

export const updateTodoBoard = async (req, res) => {
    try {
        const project = await Project.findById(toObjectId(req.params.id))
        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Build a quick lookup map by task id
        const tasksById = project.task.reduce((map, task) => {
            map[task._id.toString()] = task
            return map
        }, {})

        const updates = []

        for (const key in req.body) {
            const column = req.body[key]
            if (!column?.items) continue

            for (const index in column.items) {
                const item  = column.items[index]
                const stage = column.name || item.stage
                const task  = tasksById[item._id]
                if (!task) continue

                // Enforce RBAC for Requested column
                if (req.user?.role !== 'admin') {
                    if (task.stage === 'Requested' && stage !== 'Requested') {
                        return res.status(403).json({ message: 'Only admins can approve requested tasks.' })
                    }
                    if (task.stage !== 'Requested' && stage === 'Requested') {
                        return res.status(403).json({ message: 'Only admins can return tasks to Requested.' })
                    }
                }

                // Block task if dependencies are not yet Done
                if (task.dependencies?.length > 0 && stage !== 'Requested') {
                    const blocked = task.dependencies.some((depId) => {
                        const dep = tasksById[depId.toString()]
                        return !dep || dep.stage !== 'Done'
                    })
                    if (blocked) {
                        return res.status(422).json({
                            message: `Task "${task.title}" cannot move until all dependencies are Done.`
                        })
                    }
                }

                // Log stage change activity
                if (task.stage !== stage) {
                    task.activity.push({
                        event:     `Status changed to ${stage}`,
                        user:      req.body.user || task.updated_by || 'System',
                        timestamp: new Date()
                    })
                }

                task.stage      = stage
                task.order      = Number(index)
                task.updated_at = new Date()
                task.updated_by = req.body.user || task.updated_by || 'System'

                updates.push({ _id: task._id, stage, order: Number(index) })
            }
        }

        await project.save()
        return res.json({ updated: true, updates })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message })
    }
}
