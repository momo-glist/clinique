import React, { useEffect, useState } from "react";
import "./Sidebar.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import EventIcon from "@mui/icons-material/Event";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MedicationIcon from "@mui/icons-material/Medication";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HealingIcon from "@mui/icons-material/Healing";
import HistoryIcon from "@mui/icons-material/History";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ prenom: "", nom: "", profil: "" });
  const [poste, setPoste] = useState("");

  // Récupérer la base du chemin actuel
  const basePath = location.pathname.split("/")[1];

  // Récupérer les informations de l'utilisateur dans la table administration
  useEffect(() => {
    const token = localStorage.getItem("token");
    const idAdminClinique = localStorage.getItem("idAdminClinique");
    const idClinique = localStorage.getItem("idClinique");

    if (!idAdminClinique || !idClinique || !token) {
      console.error(
        "ID admin, ID clinique ou token JWT non disponible. Redirection vers la page de connexion."
      );
      navigate("/");
      return;
    }

    // Décodage du token pour récupérer le poste
    try {
      const decoded = jwtDecode(token);
      if (decoded && decoded.poste) {
        setPoste(decoded.poste);
      }
    } catch (err) {
      console.error("Erreur lors du décodage du token :", err);
    }

    axios
      .get(`http://localhost:5001/admin/info/${idClinique}/${idAdminClinique}`)
      .then((response) => {
        const { prenom, nom, profil } = response.data;
        setUserData({ prenom, nom, profil });
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données : ", error);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("idAdminClinique");
    localStorage.removeItem("idClinique");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="top">
        <span className="logo">
          {userData.prenom} {userData.nom}
        </span>
        {userData.profil && (
          <img
            src={`http://localhost:5001${userData.profil}`} // L'URL de l'image
            alt={`${userData.nom} ${userData.prenom}`}
            className="img"
          />
        )}
      </div>
      <hr />
      <div className="center">
        <ul>
          <p className="title">Patients</p>
          <Link to={`/${basePath}`} style={{ textDecoration: "none" }}>
            <li>
              <HomeRoundedIcon className="icon" />
              <span>Menu</span>
            </li>
          </Link>
          <Link to={`/${basePath}/arch`} style={{ textDecoration: "none" }}>
            <li>
              <ArchiveRoundedIcon className="icon" />
              <span>Consultations</span>
            </li>
          </Link>
          <Link to={`/${basePath}/labo`} style={{ textDecoration: "none" }}>
            <li>
              <ArchiveRoundedIcon className="icon" />
              <span>Laboratoire</span>
            </li>
          </Link>
          <Link to={`/${basePath}/agenda`} style={{ textDecoration: "none" }}>
            <li>
              <EventIcon className="icon" />
              <span>Agenda</span>
            </li>
          </Link>
          <p className="title">Actes et Tarifactions</p>
          <Link to={`/admin/soin`} style={{ textDecoration: "none" }}>
            <li>
              <HealingIcon className="icon" />
              <span>Soins</span>
            </li>
          </Link>
          <Link to={`/admin/soins`} style={{ textDecoration: "none" }}>
            <li>
              <MedicalServicesIcon className="icon" />
              <span>Ajouter un soin</span>
            </li>
          </Link>
          {poste !== "Administrateur clinique" && (
            <>
              <p className="title">Pharmacie</p>
              <Link to={`/admin/menu`} style={{ textDecoration: "none" }}>
                <li>
                  <MedicationIcon className="icon" />
                  <span>Medicaments</span>
                </li>
              </Link>
              <Link to={`/admin/vente`} style={{ textDecoration: "none" }}>
                <li>
                  <StorefrontIcon className="icon" />
                  <span>Ventes</span>
                </li>
              </Link>
              <Link to={`/admin/historique`} style={{ textDecoration: "none" }}>
                <li>
                  <HistoryIcon className="icon" />
                  <span>Historique d'achats</span>
                </li>
              </Link>
            </>
          )}
          <p className="title">GRH</p>
          <Link to={`/admin/administration`} style={{ textDecoration: "none" }}>
            <li>
              <SupervisorAccountIcon className="icon" />
              <span>Administration</span>
            </li>
          </Link>
          <Link to={`/admin/create`} style={{ textDecoration: "none" }}>
            <li>
              <PersonAddIcon className="icon" />
              <span>Creation</span>
            </li>
          </Link>
          <p className="title">Compte</p>
          <Link
            to="/"
            style={{ textDecoration: "none" }}
            onClick={handleLogout}
          >
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
