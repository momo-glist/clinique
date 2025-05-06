import React, { useEffect, useState, useCallback } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import "./Consult.scss";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom"; // Importer useNavigate

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
  { field: "diagnostique", headerName: "Diagnostique", width: 200 },
  { field: "prescription", headerName: "Prescription", width: 130 },
  { field: "date", headerName: "Date", width: 150 },
  { field: "heure", headerName: "Heure", width: 150 },
];

const actionColumn = [
  {
    field: "action",
    headerName: "Rendez-vous",
    width: 100,
    renderCell: (params) => (
      <div className="cellAction">
        <Link
          to={`/editi/${params.row.id}`}
          className="actionButton doneButton"
          onClick={(event) => event.stopPropagation()} // Empêcher la propagation de l'événement
        >
          Editer
        </Link>
      </div>
    ),
  },
];

const ConsultA = () => {
  const [rows, setRows] = useState([]);
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
        .get(`http://localhost:5001/${endpoint}/agenda`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
        })
        .then((response) => {
          console.log("Données reçues :", response.data);
          const updatedRows = response.data.map((item, index) => {
            // Formatage de la date
            const datetime = new Date(item.date); // Transforme la date en objet Date
            const formattedDate = datetime.toLocaleDateString("fr-FR"); // Format "DD/MM/YYYY"

            // Affichage de l'heure directement depuis item.heure
            const formattedTime = item.heure ? item.heure.substring(0, 5) : ""; // Extrait l'heure (HH:mm)

            return {
              ...item,
              id: item.id_agenda || `row-${index}`,
              date: formattedDate, // Date formatée
              heure: formattedTime, // Heure formatée
            };
          });

          setRows(updatedRows);
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des données :", error);
        });
    }
  }, [getEndpoint, token]);

  const handleRowClick = (param) => {
    navigate(`/editC/${param.id}`); // Redirection vers la page View avec l'ID de la consultation
  };

  return (
    <div className="consult">
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns.concat(actionColumn)}
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

export default ConsultA;
