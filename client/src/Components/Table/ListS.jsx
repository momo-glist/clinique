import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import "./List.scss";

const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "salaire_base", headerName: "Salaire de brute", width: 90 },
  { field: "salaire_brute", headerName: "Salaire brute", width: 90 },
  { field: "inps", headerName: "Inps", width: 90 },
  { field: "amo", headerName: "AMO", width: 130 },
];



const ListS = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const getEndpoint = useCallback(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    return pathSegments[pathSegments.length - 1];
  }, [location.pathname]);

  useEffect(() => {
    const endpoint = getEndpoint(); // dynamique
    axios
      .get(`http://localhost:5001/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const updatedRows = response.data.map((item, index) => ({
          ...item,
          id: item.id_salaire || index,
        }));
        setRows(updatedRows);
      })
      .catch((error) =>
        console.error("Erreur lors de la récupération des données :", error)
      );
  }, [getEndpoint, token]);

  const handleRowClick = (param) => {
    navigate(`/editS/${param.id}`);
  };

  return (
    <div className="list">
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
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

export default ListS;