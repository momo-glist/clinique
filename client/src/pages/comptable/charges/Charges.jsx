import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Charge.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListCompta from '../../../Components/Table/ListCompta'

const Charge = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>JOURNAL </h1>
              </div>
              <div className='bottom'>
               <ListCompta />
              </div>
            </div>
          </div>
        </div>
      )
}

export default Charge