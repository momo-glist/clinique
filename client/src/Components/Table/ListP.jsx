import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Swal from "sweetalert2"; // Import SweetAlert2
import "./List.scss";

const columns = [
  { field: "id_medicament", headerName: "ID", width: 70 },
  { field: "nom", headerName: "Nom", width: 130 },
  { field: "forme", headerName: "Forme pharmaceutique", width: 130 },
  { field: "dosage", headerName: "Dosage", width: 90 },
  {
    field: "stock_courant",
    headerName: "Quantité",
    width: 90,
    renderCell: (params) => {
      const value = params.value;
      let textColor = "";

      if (value <= 10) {
        textColor = "red";
      } else if (value <= 30) {
        textColor = "orange";
      } else if (value <= 100) {
        textColor = "#e6b800";
      } else {
        textColor = "green";
      }

      return (
        <span style={{ color: textColor, fontWeight: "bold" }}>
          {value}
        </span>
      );
    },
  },
  { field: "prix_unitaire", headerName: "Prix Unitaire", width: 90 },
  { field: "date_peremption", headerName: "Date de peremption", width: 130 },
];

const List = () => {
  const [rows, setRows] = useState([]);
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`http://localhost:5001/medicaments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) // URL dynamique
      .then((response) => {
        const updatedRows = response.data.map((item, index) => ({
          ...item,
          id: item.id_medicament || index, // Utiliser id_medicament ou un index si l'ID est manquant
          date_peremption: new Date(item.date_peremption).toLocaleDateString("fr-FR"), // Format de la date
        }));

        setRows(updatedRows); // Mettre à jour les données avec l'ID

        // Filtrer les médicaments avec stock_courant <= 10
        const lowStockMedicaments = updatedRows.filter(item => item.stock_courant <= 10);

        if (lowStockMedicaments.length > 0) {
          const medicamentNames = lowStockMedicaments.map(item => item.nom).join(", ");
          Swal.fire({
            title: "Stock bas!",
            text: `Les médicaments suivants ont un stock bas: ${medicamentNames}`,
            icon: "warning",
          });
        }
      })
      .catch((error) => console.error("Erreur lors de la récupération des données :", error));
  }, [location.pathname, token]); // Dépendance sur location.pathname pour déclencher la mise à jour

  return (
    <div className="list">
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
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

export default List;

