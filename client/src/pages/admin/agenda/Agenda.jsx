import React from 'react'
import "./Agenda.scss"
import ConsultA from '../../../Components/Consult/ConsultA';
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

const Agenda = () => {

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

export default Agenda