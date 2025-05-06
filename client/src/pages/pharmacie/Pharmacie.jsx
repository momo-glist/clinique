import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import "./Pharmacie.scss"
import Sidebar from './Sidebar/Sidebar'
import ListP from "../../Components/Table/ListP"

const Pharmacie = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>MÉDICAMENTS</h1>
              </div>
              <div className='bottom'>
               <ListP />
              </div>
            </div>
          </div>
        </div>
      )
}

export default Pharmacie