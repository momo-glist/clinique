import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Clini.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListCli from '../../../Components/Table/ListCli'

const Clini = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>Charge </h1>
              </div>
              <div className='bottom'>
               <ListCli />
              </div>
            </div>
          </div>
        </div>
      )
}

export default Clini