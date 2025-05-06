import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Patient.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListI from '../../../Components/Table/ListI'

const PatientG = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>Patients à consulter</h1>
              </div>
              <div className='bottom'>
               <ListI />
              </div>
            </div>
          </div>
        </div>
    )
}

export default PatientG