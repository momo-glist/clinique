import React from 'react';
import "./Admii.scss";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from '../../../Components/Navbar/Navbar';
import AdminTa from '../../../Components/AdminTable/AdminTa';

const AdmiiP = () => {
  

  return (
    <div className='admin'>
      <Sidebar />
      <Navbar />
      <div className='container'>
        <div className='top'>
          <div className='wrapper'>
            <h2>Employés</h2>
          </div>
        </div>
        <div className='bottom'>
          <AdminTa />
        </div>
      </div>
    </div>
  );
};

export default AdmiiP;