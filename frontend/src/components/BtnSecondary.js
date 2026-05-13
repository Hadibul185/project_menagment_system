import React from 'react'

const BtnSecondary = ({ className = '', children, ...props }) => {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ced9be] bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#304033] shadow-[0_10px_20px_rgba(38,52,41,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#e7a486] hover:bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#f4cfbc] focus:ring-offset-1 ${className}`}
        >
            {children}
        </button>
    )
}

export default BtnSecondary
