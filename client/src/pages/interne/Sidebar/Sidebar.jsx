import React, { useEffect, useState } from 'react';
import './Sidebar.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false); // Ajoutez cette ligne

  const basePath = location.pathname.split('/')[1];
  const idAdmin = localStorage.getItem('idAdmin'); // Récupérer l'ID depuis le localStorage

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (!idAdmin || !token) {
      console.error("ID admin ou token JWT non disponible. Redirection vers la page de connexion.");
      navigate('/'); // Redirige vers la page d'accueil ou de connexion
      return;
    }
  
    setLoading(true); // Lancer le chargement
  
    const endpoint = `http://localhost:5001/${basePath}/info/${idAdmin}`;
    console.log("Requête envoyée à :", endpoint);
  
    axios
      .get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`, // Inclusion du token JWT dans les en-têtes
        },
      })
      .then((response) => {
        console.log("Données reçues :", response.data);
        setAdmin(response.data); // Mise à jour des données administrateur
      })
      .catch((error) => {
        if (error.response) {
          console.error("Erreur côté serveur :", error.response.data);
          if (error.response.status === 401) {
            console.error("Token JWT invalide ou expiré. Redirection vers la page de connexion.");
            navigate('/'); // Redirige si le token est invalide ou expiré
          }
        } else if (error.request) {
          console.error("Aucune réponse reçue du serveur :", error.request);
        } else {
          console.error("Erreur lors de la configuration de la requête :", error.message);
        }
        setAdmin(null); // Réinitialise les données en cas d'erreur
      })
      .finally(() => {
        setLoading(false); // Désactive l'indicateur de chargement
      });
  }, [basePath, idAdmin, navigate]);

  return (
    <div className="sidebar">
      <div className="top">
        <span className="logo">
          {loading ? "Chargement..." : admin ? `${admin.prenom} ${admin.nom}` : "Erreur de chargement"}
        </span>
        {admin && admin.profil && (
          <img
            src={`http://localhost:5001${admin.profil}`}
            alt={`${admin.nom} ${admin.prenom}`}
            className="img"
          />
        )}
      </div>
      <hr />
      <div className="center">
        <ul>
          <p className="title">Principale</p>
          <Link to={`/interne`} style={{ textDecoration: 'none' }}>
            <li>
              <HomeRoundedIcon className="icon" />
              <span>Ajouter un Patient</span>
            </li>
          </Link>
          <Link to={`/interne/patient`} style={{ textDecoration: 'none' }}>
            <li>
              <GroupIcon className="icon" />
              <span>Mes patiens</span>
            </li>
          </Link>
          <Link to={`/interne/agenda`} style={{ textDecoration: 'none' }}>
            <li>
              <EventIcon className="icon" />
              <span>Agenda</span>
            </li>
          </Link>
          <p className="title">Compte</p>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <li>
              <ExitToAppOutlinedIcon className="icon" />
              <span>Déconnexion</span>
            </li>
          </Link>
        </ul>
      </div>
      <div className="bottom">
        <div className="colorOption"></div>
        <div className="colorOption"></div>
      </div>
    </div>
  );
};

export default Sidebar;