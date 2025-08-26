import React from 'react'
import { useNavigate } from 'react-router-dom'

function Sidebar() {
  const navigate = useNavigate()
  return (
    <div className='h-full flex items-center flex-col justify-between py-5'>
          
              <button 
              onClick={() => navigate('bucketitems')} 
              className='bg-[#333446] text-white
              rounded-md 
              p-4 px-15 
              text-2xl 
              font-semibold 
              cursor-pointer 
              active:scale-[1.05] 
              transition-transform      
              duration-300 
              ease-in-out'>
                   Show Buckets
              </button>
         
          
              <button
                 
              className='bg-[#333446] text-white
              rounded-md 
              p-4 px-15 
              text-2xl 
              font-semibold 
              cursor-pointer 
              active:scale-[1.05] 
              transition-transform      
              duration-300 
              ease-in-out' onClick={() => navigate('/')}> 
                  Home 
              </button>
         
    </div>
  )
}

export default Sidebar