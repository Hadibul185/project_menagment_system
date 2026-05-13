import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import BtnPrimary from './BtnPrimary'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

const Signup = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    })
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const response = await api.post('/auth/signup', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            })

            if (response.data && response.data.user && response.data.token) {
                login(response.data.user, response.data.token)
                toast.success('Account created successfully!')
                onSuccess && onSuccess()
                if (!onSuccess) {
                    if (response.data.user.role === 'admin') {
                        navigate('/admin')
                    } else {
                        navigate('/dashboard')
                    }
                }
            } else {
                toast.error('Invalid response from server')
            }
        } catch (error) {
            console.error('Signup error:', error)
            const message = error?.response?.data?.message || error?.message || 'Signup failed'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#2f4035]">Full name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="fancy-input"
                        placeholder="Jane Doe"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#2f4035]">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="fancy-input"
                        placeholder="jane@example.com"
                    />
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#2f4035]">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="fancy-input"
                        placeholder="Create password"
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[#2f4035]">Confirm password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="fancy-input"
                        placeholder="Confirm password"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="role" className="mb-2 block text-sm font-semibold text-[#2f4035]">Account type</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="fancy-input"
                >
                    <option value="user">Regular User</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
            <BtnPrimary type="submit" disabled={loading} className="w-full py-3 text-base font-semibold">
                {loading ? 'Creating account...' : 'Create account'}
            </BtnPrimary>
        </form>
    )

    if (onSuccess) return formContent

    return (
        <div className="page-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
            <div className="surface-card fade-up grid w-full max-w-5xl overflow-hidden lg:grid-cols-2">
                <div className="relative hidden bg-gradient-to-br from-[#0f9d90] to-[#e86a33] p-10 text-white lg:block">
                    <div className="absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f0fffa]">New Workspace</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight">Create an account and launch your flow.</h1>
                    <p className="mt-4 text-sm text-[#effff8]">Bring your team into one bold workspace for planning, ownership, and delivery momentum.</p>
                </div>
                <div className="bg-white/90 p-7 sm:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c75a2a]">Get Started</p>
                    <h2 className="mt-2 text-3xl font-semibold text-[#213227]">Create your account</h2>
                    <p className="mt-2 text-sm text-[#617367]">Set up your profile to start building projects and tracking work.</p>
                    <div className="mt-7">{formContent}</div>
                    <p className="mt-6 text-sm text-[#5b6d61]">
                        Already registered? <Link to="/login" className="font-semibold text-[#c75a2a] hover:text-[#a9481d]">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Signup
