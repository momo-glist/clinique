import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import "./ListVF.scss"; // Importer le fichier SCSS

const VenteA = () => {
  const [rows, setRows] = useState([]); // Données brutes
  const [filteredRows, setFilteredRows] = useState([]); // Données filtrées
  const [, setFilterModel] = useState({ items: [] }); // État du modèle de filtre
  const columns =[
    { field: "id", headerName: "ID", width: 150 },
    { field: "nom", headerName: "Nom", width: 180 },
    { field: "forme", headerName: "Forme", width: 150 },
    { field: "dosage", headerName: "Dosage", width: 180 },
    { field: "quantite", headerName: "Quantité Achété", width: 200 },
    { field: "date_achat", headerName: "date d'achat", width: 150 },
    { field: "fournisseur", headerName: "Fournisseur", width: 150 },
    { field: "num_fournisseur", headerName: "Numero fournisseur", width: 150 },
    { field: "montant_achat", headerName: "Montant Achat", width: 180 },
  ];
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Récupérer les données via l'API
    axios
      .get("http://localhost:5001/historique-achat", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
      }) // Remplacez cette URL par l'URL de votre API
      .then((response) => {
        console.log("Données récupérées:", response.data); // Vérification des données récupérées
        const formattedRows = response.data.map((item, index) => ({
          id: item.id_achat,
          nom: item.nom,
          forme: item.forme,
          dosage: item.dosage,
          prix_achat: item.prix_achat,
          quantite: item.quantite,
          date_achat: new Date(item.date_achat).toLocaleDateString("fr-FR"), // Formater la date
          fournisseur: item.fournisseur,
          num_fournisseur: item.num_fournisseur,
          montant_achat: item.montant_achat,
        }));
        setRows(formattedRows);
        setFilteredRows(formattedRows); // Initialiser filteredRows avec toutes les données
      })
      .catch((error) => {
        console.error(
          "Il y a eu une erreur lors de la récupération des données :",
          error
        );
      });
  }, [token]);

  // Calculer le montant total
  const totalMontantAchat = filteredRows.reduce(
    (total, row) => total + (row.montant_achat || 0),
    0
  );

  // Fonction pour gérer le filtrage
  const handleFilterChange = (filterModel) => {
    setFilterModel(filterModel); // Mettre à jour l'état du modèle de filtre

    if (filterModel.items.length === 0) {
      // Si aucun filtre n'est appliqué, afficher toutes les lignes
      setFilteredRows(rows);
    } else {
      // Appliquer le filtrage
      const filteredData = rows.filter((row) => {
        return filterModel.items.every((filter) => {
          const value = row[filter.columnField];
          const filterValue = filter.value;

          // Vérification si la valeur existe avant de la comparer
          if (value && filterValue) {
            const valueString = value.toString().toLowerCase();
            const filterValueString = filterValue.toLowerCase();
            return valueString.includes(filterValueString); // Filtrage en fonction de la valeur
          }
          return false; // Si une valeur est manquante, exclure la ligne
        });
      });
      setFilteredRows(filteredData);
    }
  };

  return (
    <div>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={filteredRows} // Utiliser filteredRows pour afficher les données filtrées
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          onFilterModelChange={handleFilterChange} // Gestion des changements de filtre
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
        />
      </div>
      {/* Montant total en dehors du DataGrid avec la classe pour l'aligner à gauche */}
      <div className="totalMontant">
        Montant Total: {totalMontantAchat.toFixed(2)} CFA
      </div>
    </div>
  );
};

export default VenteA;
