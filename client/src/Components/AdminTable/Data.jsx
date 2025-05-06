import React, { useEffect, useState } from "react";
import "./Data.scss";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "nom", headerName: "Nom", width: 130 },
  { field: "prenom", headerName: "Prenom", width: 130 },
  { field: "age", headerName: "Age", type: "number", width: 90 },
  { field: "sexe", headerName: "Sexe", width: 90 },
  { field: "ethnie", headerName: "Ethnie", width: 90 },
  { field: "tension", headerName: "Tension", width: 90 },
  { field: "type_soin", headerName: "Consultation", width: 150 },
  { field: "date", headerName: "Date", width: 150 },
  { field: "heure", headerName: "Heure", width: 150 },
];

const Data = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
  
    axios
      .get(`http://localhost:5001/admin`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
      })
      .then((response) => {
        const updatedRows = response.data.map((item, index) => {
          // Extraction de la date et de l'heure
          const datetime = new Date(item.date);
          const formattedDate = datetime.toLocaleDateString("fr-FR"); 
          const formattedTime = datetime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
  
          return {
            ...item,
            id: item.id_patient || `row-${index}`, // Utilisation d'un ID unique
            date: formattedDate, 
            heure: formattedTime, 
          };
        });
  
        setRows(updatedRows);
      })
      .catch((error) =>
        console.error("Erreur lors de la récupération des données :", error)
      );
  }, [token]);
  

  const handleRowClick = (param) => {
    navigate(`/viewa/${param.id}`); // Redirection vers la page View avec l'ID de la consultation
  };

  return (
    <div className="data">
      <Paper>
        <DataGrid
          rows={rows}
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

export default Data;
