import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-[#d8e3c9] bg-[#f9fbf6]/95 backdrop-blur'>
      <div className='mx-auto flex max-w-[1700px] flex-col items-center justify-between gap-4 px-6 py-5 lg:flex-row lg:px-8'>
        <p className='text-sm font-medium text-[#5b6f61]'>Copyright {currentYear} ProjectFlow. Crafted for focused teams.</p>
        <div className='flex flex-wrap items-center gap-5 text-sm'>
          <a href="/privacy" className='text-[#42564b] transition-colors hover:text-[#e86a33]'>Privacy Policy</a>
          <a href="/terms" className='text-[#42564b] transition-colors hover:text-[#e86a33]'>Terms of Service</a>
          <a href="/support" className='text-[#42564b] transition-colors hover:text-[#e86a33]'>Support</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
