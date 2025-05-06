import React from "react";
import "./Admin.scss";
import Sidebar from "./Sidebar/Sidebar";
import Navbar from "../../Components/Navbar/Navbar";
import Data from "../../Components/AdminTable/Data";

const Admin = () => {

  return (
    <div className="admin">
      <Sidebar />
      <Navbar />
      <div className="container">
        <div className="top">
          <div className="wrapper">
            <h2>Patient du Jour</h2>
          </div>
        </div>
        <div className="bottom">
          <Data />
        </div>
      </div>
    </div>
  );
};


export default Admin;

