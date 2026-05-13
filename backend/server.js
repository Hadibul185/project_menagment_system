import './env.js'  // ✅ Must be first — loads dotenv before all other imports
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import api from './routes/index.js'

// ─── Guard required env vars before starting ──────────────────────────────────
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in .env')
    process.exit(1)
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_PATH

if (!mongoUri) {
    console.error('FATAL: MongoDB URI is not set in .env')
    process.exit(1)
}

// ─── Express app setup ────────────────────────────────────────────────────────
const app  = express()
const PORT = process.env.SERVER_PORT || 9001

const allowedOrigins = (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'])

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)

        const normalizedOrigin = origin.trim().replace(/\/$/, '')
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true)
        }

        console.warn(`CORS blocked for origin: ${origin}`)
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: false,  // Set to true only if frontend sends cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:      100,
    message:  'Too many requests from this IP, please try again later.'
})

// ─── CORS Configuration ──────────────────────────────────────────────────────
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(limiter)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(api)
app.use('/api', api)

app.use((req, res) => {
    return res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
    if (err?.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS origin not allowed' })
    }
    console.error('Unhandled app error:', err.message)
    return res.status(500).json({ message: 'Server error', error: err.message })
})

// ─── Start server only after DB connects ──────────────────────────────────────
function startServer() {
    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Set a different SERVER_PORT in .env`)
        } else {
            console.error('Server error:', err.message)
        }
        process.exit(1)
    })
}

// ─── MongoDB connection ───────────────────────────────────────────────────────
mongoose.connect(mongoUri, {
    maxPoolSize:              10,
    minPoolSize:              5,
    maxIdleTimeMS:            300000,
    connectTimeoutMS:         10000,
    socketTimeoutMS:          45000,
    serverSelectionTimeoutMS: 5000,
    retryWrites:              true,
    retryReads:               true
})
.then(() => {
    console.log('Successfully connected to MongoDB')
    startServer()
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
})

// ─── Handle unexpected errors ─────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message)
    process.exit(1)
})
