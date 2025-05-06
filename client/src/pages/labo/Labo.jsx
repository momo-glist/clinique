import React from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import "./Labo.scss";
import Sidebar from './Sidebar/Sidebar';
import ListLabo from '../../Components/Table/ListLabo';

const Labo = () => {
  return (
    <div className="echo">
      <Navbar />
      <div className="container">
        <Sidebar />
        <div className="content">
          <div className="top">
            <h1>Patients à consulter</h1>
          </div>
          <div className="bottom">
            <ListLabo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Labo;