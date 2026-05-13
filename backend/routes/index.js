import express from 'express'
import joi from 'joi'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import {
    signup, login, verifyLogin, getProfile, updateProfile, getAllUsers, updateUserRole, deleteUser,
    getAllProjects, getProjectById, createProject, updateProject, deleteProject,
    createTask, getTaskById, updateTask, deleteTask,
    addTimeLog,
    updateTodoBoard
} from '../controllers/index.js'

const api = express.Router()

// ─── JWT Secret Guard ─────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set')

// ─── Authentication Middleware ────────────────────────────────────────────────
const getBearerToken = (req) => {
    const authHeader = req.headers['authorization']

    return authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null
}

const getUserFromToken = async (token) => {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id).select('_id name email role isActive')

    if (!user) {
        const error = new Error('User not found')
        error.status = 401
        error.code = 'USER_NOT_FOUND'
        throw error
    }

    if (user.isActive === false) {
        const error = new Error('User account is disabled')
        error.status = 403
        error.code = 'USER_DISABLED'
        throw error
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
    }
}

const sendAuthError = (res, err) => {
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expired',
            code: 'TOKEN_EXPIRED'
        })
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid or malformed token',
            code: 'INVALID_TOKEN'
        })
    }

    return res.status(err.status || 401).json({
        message: err.message || 'Authentication failed',
        code: err.code || 'AUTH_FAILED'
    })
}

const authenticateToken = async (req, res, next) => {
    const token = getBearerToken(req)

    if (!token) {
        return res.status(401).json({ 
            message: 'Access token required',
            code: 'NO_TOKEN'
        })
    }

    try {
        req.user = await getUserFromToken(token)
        next()
    } catch (err) {
        return sendAuthError(res, err)
    }
}

const optionallyAuthenticateToken = async (req, res, next) => {
    const token = getBearerToken(req)

    if (!token) {
        return next()
    }

    try {
        req.user = await getUserFromToken(token)
    } catch (err) {
        console.warn('Ignoring optional auth token:', err.message)
    }

    return next()
}

// ─── Admin Middleware ─────────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' })
    }
    next()
}

// ─── Validation Middleware Factory ────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true })
    if (error) {
        return res.status(422).json({
            message: 'Validation failed',
            details: error.details.map((d) => ({ message: d.message, path: d.path }))
        })
    }
    req.body = value
    next()
}

// ─── Joi Schemas ──────────────────────────────────────────────────────────────
const schemas = {
    signup: joi.object({
        name:     joi.string().min(2).max(50).required(),
        email:    joi.string().email().required(),
        password: joi.string().min(6).required(),
        role:     joi.string().valid('superadmin', 'admin', 'user').default('user')
    }),

    login: joi.object({
        email:    joi.string().email().required(),
        password: joi.string().required()
    }),

    profileUpdate: joi.object({
        name:     joi.string().min(2).max(50).required(),
        email:    joi.string().email().required(),
        password: joi.string().min(6).allow('', null).optional()
    }),

    userRoleUpdate: joi.object({
        role: joi.string().valid('superadmin', 'admin', 'user').required()
    }),

    verifyLogin: joi.object({
        email: joi.string().email().required(),
        code:  joi.string().length(6).required()
    }),

    project: joi.object({
        title:       joi.string().min(3).max(100).required(),
        description: joi.string().min(1).required(),
        deadline:    joi.date().iso().allow(null, ''),
        members:     joi.alternatives().try(
            joi.string().allow(''),
            joi.array().items(joi.string().trim())
        ).optional(),
        teamMembers: joi.alternatives().try(
            joi.string().allow(''),
            joi.array().items(joi.string().trim())
        ).optional(),
        createdBy:  joi.string().optional(),
        created_by: joi.string().optional()
    }),

    projectUpdate: joi.object({
        title:       joi.string().min(3).max(100).required(),
        description: joi.string().required(),
        deadline:    joi.date().iso().allow(null, ''),
        members:     joi.array().items(joi.string()).optional()
    }),

    task: joi.object({
        title:        joi.string().min(3).max(100).required(),
        description:  joi.string().required(),
        assigned_to:  joi.string().allow('', null).optional(),
        created_by:   joi.string().allow('', null).optional(),
        updated_by:   joi.string().allow('', null).optional(),
        due_date:     joi.date().iso().allow(null).optional(),
        dependencies: joi.array().items(joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
    }),

    taskUpdate: joi.object({
        title:        joi.string().min(3).max(100).required(),
        description:  joi.string().required(),
        assigned_to:  joi.string().allow('', null).optional(),
        updated_by:   joi.string().allow('', null).optional(),
        due_date:     joi.date().iso().allow(null).optional(),
        dependencies: joi.array().items(joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
    }),

    timeLog: joi.object({
        user:       joi.string().allow('', null).optional(),
        started_at: joi.date().iso().required(),
        ended_at:   joi.date().iso().required()
    })
}

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════
api.post('/auth/signup',         validate(schemas.signup), signup)
api.post('/auth/login',          validate(schemas.login),  login)
api.post('/auth/verify-login',   validate(schemas.verifyLogin), verifyLogin)
api.get('/auth/profile',         authenticateToken,        getProfile)
api.put('/auth/profile',         authenticateToken,        validate(schemas.profileUpdate), updateProfile)
api.get('/auth/users',           authenticateToken, isAdmin, getAllUsers)
api.put('/auth/user/:id/role',   authenticateToken, isAdmin, validate(schemas.userRoleUpdate), updateUserRole)
api.delete('/auth/user/:id',     authenticateToken, isAdmin, deleteUser)

// ═════════════════════════════════════════════════════════════════════════════
//  PROJECT ROUTES
// ═════════════════════════════════════════════════════════════════════════════
api.get('/projects',       optionallyAuthenticateToken, getAllProjects)
api.get('/project/:id',    getProjectById)
api.post('/project',       authenticateToken, isAdmin, validate(schemas.project),       createProject)
api.put('/project/:id',    authenticateToken, isAdmin, validate(schemas.projectUpdate), updateProject)
api.delete('/project/:id', authenticateToken, isAdmin,                                  deleteProject)

// ═════════════════════════════════════════════════════════════════════════════
//  TASK ROUTES
// ═════════════════════════════════════════════════════════════════════════════
api.post('/project/:id/task',              authenticateToken, validate(schemas.task),       createTask)
api.get('/project/:id/task/:taskId',       authenticateToken,                              getTaskById)
api.put('/project/:id/task/:taskId',       authenticateToken, validate(schemas.taskUpdate), updateTask)
api.delete('/project/:id/task/:taskId',    authenticateToken, isAdmin,                              deleteTask)

// ═════════════════════════════════════════════════════════════════════════════
//  TIME LOG ROUTE
// ═════════════════════════════════════════════════════════════════════════════
api.post('/project/:id/task/:taskId/time-log', authenticateToken, validate(schemas.timeLog), addTimeLog)

// ═════════════════════════════════════════════════════════════════════════════
//  KANBAN ROUTE
// ═════════════════════════════════════════════════════════════════════════════
api.put('/project/:id/todo', authenticateToken, updateTodoBoard)

export default api
