import React, { useEffect, useState } from "react";
import "./Data.scss";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";

const AdminTa = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const idAdminClinique = localStorage.getItem("idAdminClinique");

  useEffect(() => {
    if (!token) {
      console.error("⛔ Aucun token trouvé dans le localStorage !");
      return;
    }

    axios
      .get(`http://localhost:5001/administration/${idAdminClinique}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (!Array.isArray(response.data)) {
          console.error(
            "⛔ Erreur : Les données reçues ne sont pas un tableau :",
            response.data
          );
          return;
        }

        const updatedRows = response.data.map((item, index) => ({
          ...item,
          id: item.id_admin_clinique || `row-${index}`, // Utilisation d'un ID unique
        }));

        setRows(updatedRows);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données :", error);
      });
  }, [token, idAdminClinique]);

  // Fonction de suppression
  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet Employé ?")) {
      axios
        .delete(`http://localhost:5001/delete_admin/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(() => {
          setRows((prevRows) => prevRows.filter((row) => row.id !== id)); // Met à jour les lignes localement
        })
        .catch((error) =>
          console.error("Erreur lors de la suppression :", error)
        );
    }
  };

  const handleRowClick = (param) => {
    console.log("✅ ID cliqué :", param.id);
    navigate(`/editadmin/${param.id}`);
  };

  const formatDate = (date) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(date).toLocaleDateString("fr-FR", options);
  };
  // Définir les colonnes dans le composant, où handleDelete est accessible
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "profil",
      headerName: "Profil",
      width: 150,
      renderCell: (params) => {
        const cheminComplet = params.value;

        if (!cheminComplet) {
          return <span>Aucun</span>; // ou afficher une image par défaut
        }

        const urlImage = cheminComplet
          ? `http://localhost:5001/images/${cheminComplet.split("/").pop()}`
          : "http://localhost:5001/images/default-user.png"; // image par défaut

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <img
              src={urlImage}
              alt="Profil"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            />
          </div>
        );
      },
    },
    { field: "nom", headerName: "Nom", width: 130 },
    { field: "prenom", headerName: "Prenom", width: 130 },
    { field: "date_naissance", headerName: "Date de naissance", width: 90 },
    { field: "sexe", headerName: "Sexe", width: 90 },
    { field: "situation", headerName: "Situation matrimoniale", width: 90 },
    { field: "diplome", headerName: "Diplome", width: 90 },
    { field: "niveau", headerName: "Niveau", width: 90 },
    {
      field: "nombre_consultation",
      headerName: "Nombre de consultations",
      width: 90,
    },
    { field: "departement", headerName: "Departement", width: 150 },
    { field: "poste", headerName: "Poste", width: 150 },
    { field: "salaire_brute", headerName: "Salaire", width: 150 },
    {
      field: "date_e",
      headerName: "Date d'embauche",
      width: 150,
      renderCell: (params) => {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            {formatDate(params.value)}{" "}
            {/* Appliquez la fonction de formatage */}
          </div>
        );
      },
    },
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

  return (
    <div className="data">
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10]}
          rowHeight={80} // Augmente la hauteur des lignes
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

export default AdminTa;
