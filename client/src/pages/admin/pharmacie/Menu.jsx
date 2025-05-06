import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Pharmacie.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListP from "../../../Components/Table/ListP"

const Menu = () => {
    return (
        <div className='admin'>
          <Sidebar />
          <Navbar />
          <div className='container'>
            <div className='top'> 
              <div className='Wrapper'>
                <h1>Medicaments</h1>
              </div>
            </div>
            <div className='bottom'>
               <ListP />
              </div>
          </div>
        </div>
      )
}

export default Menu