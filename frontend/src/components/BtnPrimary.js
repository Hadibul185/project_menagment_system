import React from 'react'

const BtnPrimary = ({ className = '', children, ...props }) => {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-[#e86a33] to-[#0f9d90] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(232,106,51,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_26px_rgba(232,106,51,0.3)] focus:outline-none focus:ring-2 focus:ring-[#f4b08f] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
            {children}
        </button>
    )
}

export default BtnPrimary;
