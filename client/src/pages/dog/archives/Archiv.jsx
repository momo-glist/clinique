import React from 'react'
import "./Archive.scss";
import Sidebar from "../../../Components/sidebar/Sidebar";
import Navbar from '../../../Components/Navbar/Navbar';
import Consult from '../../../Components/Consult/Consult';

const ArchivDog = () => {
  
    return (
      <div className='arch'>
        <Sidebar />
        <Navbar />
        <div className='container'>
          <div className='top'>
            <div className='wrapper'>
              <h2>Consultation</h2>
            </div>
          </div>
          <div className='bottom'>
            <Consult />
          </div>
        </div>
      </div>
    );
}

export default ArchivDog