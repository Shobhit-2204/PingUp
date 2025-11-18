import React from 'react'
import { menuItemsData } from '../assets/assets.js'
import { NavLink } from 'react-router-dom'

const MenuItems = ({setSidebarOpen}) => {
  return (
    <div className='px-6 text-slate-400 space-y-1 font-medium'>
        {
            menuItemsData.map(({to, label, Icon})=>(
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({isActive}) =>
                    `px-3.5 py-2 flex items-center gap-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
                    }`
                  }
                >
                    <Icon className="w-5 h-5"/>
                    {label}
                </NavLink>
            ))
        }
    </div>
  )
}

export default MenuItems