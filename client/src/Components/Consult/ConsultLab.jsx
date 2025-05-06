import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import "./Consult.scss";
import axios from "axios";
import { useLocation, useNavigate } from 'react-router-dom';

const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "nom", headerName: "Nom", width: 130 },
  { field: "prenom", headerName: "Prenom", width: 130 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
  { field: "sexe", headerName: "Sexe", width: 90 },
  { field: "ethnie", headerName: "Ethnie", width: 90 },
  { field: "telephone", headerName: "Telephone", width: 130 },
  { field: "localite", headerName: "Localité", width: 130 },
  { field: "type_soin", headerName: "Type de soin", width: 90 },
  { field: "nature", headerName: "Nature", width: 200 },
  { field: "resultat", headerName: "Resultat", width: 130 },
  { field: "renseignement", headerName: "Renseignement", width: 130 },
  { field: "date", headerName: "Date", width: 150 },
  { field: "heure", headerName: "Heure", width: 150 },
];

const ConsultLab = () => {
  const [rows, setRows] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter] = useState("jour"); // par défaut, filtrer par jour
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Fonction pour extraire le segment dynamique de l'URL avant /arch
  const getEndpoint = useCallback(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    return pathSegments[pathSegments.length - 1];
  }, [location.pathname]);

  useEffect(() => {
    const endpoint = getEndpoint();
    if (endpoint) {
      axios
        .get(`http://localhost:5001/${endpoint}/consult`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
        }) // Utilisation de l'endpoint correctement extrait
        .then((response) => {
          const updatedRows = response.data.map((item, index) => {
            const datetime = new Date(item.date); // Conserver la date complète ici
            const formattedDate = datetime.toLocaleDateString("fr-FR");
            const formattedTime = datetime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return {
              ...item,
              id: item.id || `row-${index}`, // Ajoutez un ID unique basé sur l'index ou l'ID
              date: formattedDate,  // Afficher la date formatée
              heure: formattedTime, // Afficher l'heure formatée
              originalDate: datetime // Ajouter la date originale pour les comparaisons
            };
          });

          setRows(updatedRows);
          setFilteredData(updatedRows); // Initialiser avec toutes les données
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des données :", error);
        });
    }
  }, [getEndpoint, token]);

  // Fonction pour filtrer les données par jour, mois, ou année
  const filterData = useCallback(() => {
    let filtered = [...rows];
    const currentDate = new Date();
  
    if (filter === "mois") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.originalDate);
        return itemDate.getMonth() === currentDate.getMonth() &&
               itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else if (filter === "annee") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.originalDate);
        return itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else {
      filtered = rows;
    }
  
    setFilteredData(filtered);
  }, [rows, filter]);  

  useEffect(() => {
    filterData();
  }, [filterData]);  

  const handleRowClick = (param) => {
    navigate(`/viewc/${param.id}`); // Redirection vers la page View avec l'ID de la consultation
  };

  return (
    <div className="consult">
      <Paper>
        <DataGrid
          rows={filteredData}
          columns={columns}
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 5 } },
          }}
          onRowClick={(param) => handleRowClick(param)} // Ajout de l'événement de clic
          localeText={{
            columnMenuSortAsc: "Trier par ordre croissant",
            columnMenuSortDesc: "Trier par ordre décroissant",
            columnMenuFilter: "Filtrer",
            columnMenuHideColumn: "Cacher la colonne",
            columnMenuManageColumns: "Gérer les colonnes",
            toolbarColumns: "Colonnes",
            toolbarColumnsLabel: "Gérer les colonnes",
            columnsPanelShowAllButton: "Afficher/Masquer tout",
            columnsPanelHideAllButton: "Masquer tout",
            columnsPanelResetButton: "Réinitialiser",
          }}
          sx={{
            border: 0,
          }}
        />
      </Paper>
    </div>
  );
};

export default ConsultLab;