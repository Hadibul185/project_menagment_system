import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

const AppLayout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    return (
        <div className='page-shell min-h-screen'>
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div className='mx-auto flex min-h-[calc(100vh-148px)] w-full max-w-[1700px] flex-col gap-5 px-4 pb-8 pt-5 sm:px-6 lg:gap-8 lg:px-8'>
                <main className='fade-up flex-1'>
                    <div className='mx-auto w-full max-w-[1500px]'>
                        {children}
                    </div>
                </main>
            </div>

            {isSidebarOpen && (
                <div className='fixed inset-0 z-50'>
                    <button
                        type='button'
                        onClick={() => setSidebarOpen(false)}
                        className='absolute inset-0 bg-[#0d1d14]/45 backdrop-blur-sm'
                        aria-label='Close sidebar backdrop'
                    />
                    <aside className='absolute left-0 top-0 h-full w-[min(23rem,92vw)] p-3 sm:p-4'>
                        <div className='relative h-full'>
                            <button
                                type='button'
                                onClick={() => setSidebarOpen(false)}
                                className='absolute right-4 top-4 z-10 rounded-xl bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#405449] shadow-sm'
                            >
                                Close
                            </button>
                            <Sidebar onNavigate={() => setSidebarOpen(false)} />
                        </div>
                    </aside>
                </div>
            )}

            <Footer />
        </div>
    )
}

export default AppLayout
