import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Header = ({ onMenuClick }) => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className='relative z-10 border-b border-[#d5e0c5] bg-[#fcfdf9]/95 backdrop-blur'>
      <div className='mx-auto flex max-w-[1700px] flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-4 fade-up'>
          <button
            type='button'
            onClick={onMenuClick}
            className='float-soft flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e86a33] to-[#0f9d90] text-white shadow-[0_14px_28px_rgba(232,106,51,0.35)] transition hover:brightness-110'
            aria-label='Open sidebar menu'
          >
            <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M4 7h16M4 12h16M4 17h10' />
            </svg>
          </button>
          <div>
            <h1 className='text-xl font-semibold tracking-tight text-[#203127] sm:text-2xl'>ProjectFlow Studio</h1>
            <p className='text-sm text-[#5d6e62]'>Design-led workspace for planning, execution, and delivery.</p>
          </div>
        </div>

        <div className='fade-up stagger-1 flex flex-col items-start gap-3 sm:flex-row sm:items-center flex-wrap'>
          <div className='rounded-full border border-[#dce8cc] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2a3b30]'>
            Build with clarity
          </div>
          <div className='rounded-full border border-[#dce8cc] bg-[#f3f8ec] px-4 py-2 text-sm font-medium text-[#44584a]'>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>

          {isAuthenticated && user && (
            <div className='flex items-center gap-3 rounded-2xl border border-[#d8e3c9] bg-white/90 px-4 py-2'>
              <div className='text-right leading-tight'>
                <p className='text-sm font-semibold text-[#1f2e24]'>{user.name}</p>
                <p className='text-xs uppercase tracking-[0.12em] text-[#6b7e71]'>{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className='inline-flex h-9 items-center justify-center rounded-xl bg-[#e86a33] px-4 text-sm font-semibold text-white transition hover:bg-[#c24d1b] lg:hidden'
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
