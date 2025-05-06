import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { Link } from "react-router-dom";
import "./List.scss";

const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "nom", headerName: "Nom", width: 130 },
  { field: "prenom", headerName: "Prénom", width: 130 },
  { field: "age", headerName: "Âge", type: "number", width: 90 },
  { field: "sexe", headerName: "Sexe", width: 90 },
  { field: "ethnie", headerName: "Ethnie", width: 90 },
  { field: "telephone", headerName: "Téléphone", width: 130 },
  { field: "localite", headerName: "Localité", width: 130 },
  { field: "tension", headerName: "Tension", width: 90 },
  { field: "temperature", headerName: "Temperature", width: 90 },
  { field: "poids", headerName: "Poids", width: 90 },
  { field: "type_soin", headerName: "Type de soins", width: 90 },
];

const actionColumn = [
  {
    field: "action",
    headerName: "Rendez-vous",
    width: 100,
    renderCell: (params) => (
      <div className="cellAction">
        <Link
          to={`/edita/${params.row.id}`}
          className="actionButton doneButton"
          onClick={(event) => event.stopPropagation()}
        >
          Editer
        </Link>
      </div>
    ),
  },
];

const List = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const getEndpoint = useCallback(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    return pathSegments[pathSegments.length - 1];
  }, [location.pathname]);

  useEffect(() => {
    const endpoint = getEndpoint(); // Obtenir l'endpoint dynamique
    axios
      .get(`http://localhost:5001/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
      }) // URL dynamique
      .then((response) => {
        const updatedRows = response.data.map((item, index) => ({
          ...item,
          id: item.id_patient || index, // Utiliser id_patient ou un index si l'ID est manquant
        }));

        setRows(updatedRows); // Mettre à jour les données avec l'ID
      })
      .catch((error) =>
        console.error("Erreur lors de la récupération des données :", error)
      );
  }, [getEndpoint, token]);

  const handleRowClick = (param) => {
    navigate(`/edit/${param.id}`);
  };

  return (
    <div className="list">
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns.concat(actionColumn)}
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

export default List;
