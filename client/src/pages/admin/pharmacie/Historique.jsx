import React from 'react'
import Navbar from '../../../Components/Navbar/Navbar'
import "./Pharmacie.scss"
import Sidebar from '../Sidebar/Sidebar'
import ListH from "../../../Components/Table/ListH"

const Historique = () => {
    return (
        <div className='admin'>
          <Sidebar />
          <Navbar />
          <div className='container'>
            <div className='top'> 
              <div className='wrapper'>
                <h1>Historique d'achat</h1>
              </div>
            </div>
            <div className='bottom'>
               <ListH />
            </div>
          </div>
        </div>
      )
}

export default Historique