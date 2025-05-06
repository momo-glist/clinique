import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Menu.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListS from '../../../Components/Table/ListS'

const MenuSal = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>Salaire</h1>
              </div>
              <div className='bottom'>
               <ListS />
              </div>
            </div>
          </div>
        </div>
    )
}

export default MenuSal