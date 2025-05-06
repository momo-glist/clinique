import React from 'react';
import "./Soin.scss";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from '../../../Components/Navbar/Navbar';
import DataS from '../../../Components/AdminTable/DataS';

const Soin = () => {
  

  return (
    <div className='admin'>
      <Sidebar />
      <Navbar />
      <div className='container'>
        <div className='top'>
          <div className='wrapper'>
            <h2>Les différents soins</h2>
          </div>
        </div>
        <div className='bottom'>
          <DataS />
        </div>
      </div>
    </div>
  );
};

export default Soin;