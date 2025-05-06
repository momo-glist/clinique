import React from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import "./Dog.scss";
import Sidebar from '../../Components/sidebar/Sidebar';
import List from "../../Components/Table/List";

const Dog = () => {
  return (
    <div className="echo">
      <Navbar />
      <div className="container">
        <Sidebar />
        <div className="content">
          <div className="top">
            <h1>Consultation</h1>
          </div>
          <div className="bottom">
            <List />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dog;

