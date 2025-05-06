import React from 'react'
import "./Agenda.scss"
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../../../Components/sidebar/Sidebar";
import ConsultA from '../../../Components/Consult/ConsultA';

const AgendaDog = () => {

  return (
    <div className='agenda'>
    <Sidebar />
    <Navbar />
    <div className='container'>
      <div className='top'>
        <div className='wrapper'>
          <h2>Rendez vous</h2>
        </div>
      </div>
      <div className='bottom'>
        <ConsultA />
      </div>
    </div>
  </div>
  )
}

export default AgendaDog