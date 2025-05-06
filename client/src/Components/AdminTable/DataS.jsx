import React, { useEffect, useState } from "react";
import "./Data.scss";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";



const Data = () => {
  const [rows, setRows] = useState([]);
  const token = localStorage.getItem("token");

  // Fonction de suppression
  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce soin ?")) {
      axios
        .delete(`http://localhost:5001/delete_soins/${id}`)
        .then(() => {
          setRows((prevRows) => prevRows.filter((row) => row.id !== id)); // Met à jour les lignes localement
        })
        .catch((error) =>
          console.error("Erreur lors de la suppression :", error)
        );
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "type_soin", headerName: "Type de soin", width: 200 },
    { field: "departement", headerName: "Département", width: 200 },
    { field: "prix", headerName: "Prix", type: "number", width: 100 },
    {
      field: "action",
      headerName: "Action",
      width: 100,
      renderCell: (params) => (
        <div className="cellAction">
          <DeleteIcon
            style={{ cursor: "pointer", color: "red" }}
            onClick={(event) => {
              event.stopPropagation(); // Empêche la redirection lors du clic
              handleDelete(params.id); // Appelle la fonction de suppression
            }}
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    axios
      .get("http://localhost:5001/soins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const soins = response.data.soins; // Accéder à la clé 'soins'
        const updatedRows = soins.map((item, index) => {
          return {
            ...item,
            id: item.id_soin, // Générer un ID unique basé sur l'index
          };
        });

        setRows(updatedRows); // Mettre à jour les lignes pour le DataGrid
      })
      .catch((error) =>
        console.error("Erreur lors de la récupération des données :", error)
      );
  }, [token]);

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
