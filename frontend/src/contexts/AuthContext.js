import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (token && userData) {
            setIsAuthenticated(true)
            setUser(JSON.parse(userData))
        }
        setLoading(false)
    }, [])

    const [pendingAction, setPendingAction] = useState(null)
    const [authModalOpen, setAuthModalOpen] = useState(false)

    const triggerAuth = useCallback((action) => {
        setPendingAction(action)
        setAuthModalOpen(true)
    }, [])

    const clearPendingAction = useCallback(() => setPendingAction(null), [])

    const executePendingAction = useCallback(() => {
        if (pendingAction) {
            console.log('Executing pending action:', pendingAction.type)
            
            // Handle different action types
            switch (pendingAction.type) {
                case 'addProject':
                case 'createProject': {
                    const createEvent = new CustomEvent('pendingProjectCreate', {
                        detail: pendingAction.projectData || {}
                    })
                    document.dispatchEvent(createEvent)
                    break
                }
                case 'editProject': {
                    const editEvent = new CustomEvent('pendingProjectEdit', {
                        detail: {
                            projectId: pendingAction.projectId,
                            projectData: pendingAction.projectData
                        }
                    })
                    document.dispatchEvent(editEvent)
                    break
                }
                case 'tokenExpired':
                    toast.success('Session restored successfully!')
                    break
                default:
                    console.log('Unknown pending action type:', pendingAction.type)
            }
            
            clearPendingAction()
        }
    }, [pendingAction, clearPendingAction])

    const login = useCallback((userData, token) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setIsAuthenticated(true)
        setUser(userData)
        
        // Execute any pending action after successful login
        setTimeout(() => {
            executePendingAction()
        }, 100)
    }, [executePendingAction])

    const logout = useCallback(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
        setUser(null)
        setAuthModalOpen(false)
    }, [])

    // Handler for authentication failures (invalid/expired token)
    const handleAuthFailure = useCallback((error) => {
        console.log('Auth failure detected:', error?.response?.status)
        logout() // Clear any existing auth state
        triggerAuth({ 
            type: 'tokenExpired',
            error: error?.response?.data?.message || 'Session expired. Please log in again.'
        })
    }, [logout, triggerAuth])

    const value = {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        pendingAction,
        triggerAuth,
        clearPendingAction,
        executePendingAction,
        authModalOpen,
        setAuthModalOpen,
        handleAuthFailure
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}