import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Pharmacie.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListVF from "../../../Components/Table/ListVF"

const Ventes = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>Ventes</h1>
              </div>
              <div className='bottom'>
               <ListVF />
              </div>
            </div>
          </div>
        </div>
      )
}

export default Ventes