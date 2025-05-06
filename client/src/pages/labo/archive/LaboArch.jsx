import React from 'react'
import "./LaboArch.scss";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from '../../../Components/Navbar/Navbar';
import ConsultLab from '../../../Components/Consult/ConsultLab';

const LaboArch = () => {
  
    return (
      <div className='arch'>
        <Sidebar />
        <Navbar />
        <div className='container'>
          <div className='top'>
            <div className='wrapper'>
              <h2>Consultations</h2>
            </div>
          </div>
          <div className='bottom'>
            <ConsultLab />
          </div>
        </div>
      </div>
    );
}

export default LaboArch