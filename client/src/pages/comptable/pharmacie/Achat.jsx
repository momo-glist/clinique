import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Pharmacie.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListH from "../../../Components/Table/ListH"

const Achat = () => {
    return (
        <div className='echo'>
          <Navbar />
          <div className='container'>
            <Sidebar />
            <div className='content'> 
              <div className='top'>
                <h1>Historique d'achat</h1>
              </div>
              <div className='bottom'>
               <ListH />
              </div>
            </div>
          </div>
        </div>
      )
}

export default Achat