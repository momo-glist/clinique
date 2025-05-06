import React from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Pharmacie.scss";
import Sidebar from "./Sidebar/Sidebar";
import ListV from "../../Components/Table/ListV";

const Vente = () => {
  return (
    <div className="echo">
      <Navbar />
      <div className="container">
        <Sidebar />
        <div className="content">
          <div className="top">
            <h1>VENTE</h1>
          </div>
          <div className="bottom">
            <ListV />
          </div>
        </div>
      </div>
    </div>
  ); 
};

export default Vente;
