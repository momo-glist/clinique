import React, { useEffect, useState } from "react";
import "./Sidebar.scss";
import { Link, useLocation, useNavigate } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HistoryIcon from "@mui/icons-material/History";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false); // Ajoutez cette ligne
  const [poste, setPoste] = useState("");

  const basePath = location.pathname.split("/")[1];
  const idClinique = localStorage.getItem("idClinique"); // Récupérer l'ID clinique depuis localStorage
  const idAdminClinique = localStorage.getItem("idAdminClinique"); // Récupérer l'ID admin clinique depuis localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {

    if (!idClinique || !idAdminClinique || !token) {
      console.error(
        "ID admin clinique, ID clinique ou token JWT non disponible. Redirection vers la page de connexion."
      );
      navigate("/"); // Redirige vers la page d'accueil ou de connexion
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

    setLoading(true); // Lancer le chargement

    const endpoint = `http://localhost:5001/admin/info/${idClinique}/${idAdminClinique}`;
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
            console.error(
              "Token JWT invalide ou expiré. Redirection vers la page de connexion."
            );
            navigate("/"); // Redirige si le token est invalide ou expiré
          }
        } else if (error.request) {
          console.error("Aucune réponse reçue du serveur :", error.request);
        } else {
          console.error(
            "Erreur lors de la configuration de la requête :",
            error.message
          );
        }
        setAdmin(null); // Réinitialise les données en cas d'erreur
      })
      .finally(() => {
        setLoading(false); // Désactive l'indicateur de chargement
      });
  }, [basePath, idAdminClinique, idClinique, navigate, token]);

  return (
    <div className="sidebar">
      <div className="top">
        <span className="logo">
          {loading
            ? "Chargement..."
            : admin
            ? `${admin.prenom} ${admin.nom}`
            : "Erreur de chargement"}
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
          <p className="title">MAIN</p>
          <Link to={`/${basePath}`} style={{ textDecoration: "none" }}>
            <li>
              <HomeRoundedIcon className="icon" />
              <span>Menu</span>
            </li>
          </Link>
          {poste === "Administrateur pharmacie" && (
            <>
              <Link
                to={`/pharmacie/ventes`}
                style={{ textDecoration: "none" }}
              >
                <li>
                  <StorefrontIcon className="icon" />
                  <span>Ventes</span>
                </li>
              </Link>
              <Link
                to={`/pharmacie/historique`}
                style={{ textDecoration: "none" }}
              >
                <li>
                  <HistoryIcon className="icon" />
                  <span>Historique d'achats</span>
                </li>
              </Link>
            </>
          )}
          {poste === "Pharmacien" && (
            <>
              <Link to={`/pharmacie/vente`} style={{ textDecoration: "none" }}>
                <li>
                  <StorefrontIcon className="icon" />
                  <span>Vente</span>
                </li>
              </Link>
              <Link to={`/pharmacie/ajout`} style={{ textDecoration: "none" }}>
                <li>
                  <ProductionQuantityLimitsIcon className="icon" />
                  <span>Nouveau Produit</span>
                </li>
              </Link>
            </>
          )}
          {poste === "Administrateur pharmacie" && (
            <>
              <p className="title">GRH</p>
              <Link
                to={`/pharmacie/administration`}
                style={{ textDecoration: "none" }}
              >
                <li>
                  <SupervisorAccountIcon className="icon" />
                  <span>Administration</span>
                </li>
              </Link>
              <Link to={`/pharmacie/create`} style={{ textDecoration: "none" }}>
                <li>
                  <PersonAddIcon className="icon" />
                  <span>Creation</span>
                </li>
              </Link>
            </>
          )}
          <p className="title">Compte</p>
          <Link to="/" style={{ textDecoration: "none" }}>
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
