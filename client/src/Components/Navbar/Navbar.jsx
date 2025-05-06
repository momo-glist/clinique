import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./Navbar.scss";

const Navbar = () => {
  const token = localStorage.getItem("token");
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5001/clinique", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Données reçues :", response.data);
        if (response.data.length > 0) {
          setAdmin(response.data[0]); // Prendre le premier élément du tableau
        } else {
          setAdmin(null);
        }
      })
      .catch((error) => {
        console.error("Aucune réponse reçue du serveur :", error.request);
        setAdmin(null);
      });
  }, [token]);

  return (
    <div className="navbar">
      <h1 className="title">{admin ? admin.nom : "Chargement..."}</h1>
    </div>
  );
};

export default Navbar;
