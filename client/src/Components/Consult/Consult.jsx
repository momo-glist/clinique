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
  { field: "tension", headerName: "Tension", width: 90 },
  { field: "temperature", headerName: "Temperature", width: 90 },
  { field: "poids", headerName: "Poids", width: 90 },
  { field: "type_soin", headerName: "Type de soin", width: 90 },
  { field: "diagnostique", headerName: "Diagnostique", width: 200 },
  { field: "prescription", headerName: "Prescription", width: 130 },
  { field: "date", headerName: "Date", width: 150 },
  { field: "heure", headerName: "Heure", width: 150 },
];

const Consult = () => {
  const [rows, setRows] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filter] = useState("jour"); // par défaut, filtrer par jour
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Fonction pour extraire le segment dynamique de l'URL avant /arch
  const getEndpoint = useCallback(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    return pathSegments[0];
  }, [location.pathname]);

  useEffect(() => {
    const endpoint = getEndpoint();
    if (endpoint) {
      axios
        .get(`http://localhost:5001/${endpoint}/arch`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
        }) // Utilisation de l'endpoint correctement extrait
        .then((response) => {
          console.log("Réponse brute :", response.data);
          console.log("Réponse complète Axios :", response);
        
          if (!Array.isArray(response.data)) {
            console.error("Erreur : les données ne sont pas un tableau :", response.data);
            return;
          }
        
          const updatedRows = response.data.map((item, index) => {
            const datetime = new Date(item.date);
            const formattedDate = datetime.toLocaleDateString("fr-FR");
            const formattedTime = datetime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            });
        
            return {
              ...item,
              id: item.id || `row-${index}`,
              date: formattedDate,
              heure: formattedTime,
              originalDate: datetime,
            };
          });
        
          setRows(updatedRows);
          setFilteredData(updatedRows);
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
        const itemDate = new Date(item.originalDate); // Comparer avec la date originale
        return itemDate.getMonth() === currentDate.getMonth() && itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else if (filter === "annee") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.originalDate); // Comparer avec la date originale
        return itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else if (filter === "jour") {
      // Afficher toutes les consultations, peu importe la date
      filtered = rows;
    }
  
    setFilteredData(filtered); // Mettre à jour les données filtrées
  }, [rows, filter]);
  

  useEffect(() => {
    filterData(); // Appliquer le filtre chaque fois que le type de filtre change
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

export default Consult;




