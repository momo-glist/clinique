import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import "./ListVF.scss"; // Importer le fichier SCSS

const VenteA = () => {
  const [rows, setRows] = useState([]); // Données brutes
  const [filteredRows, setFilteredRows] = useState([]); // Données filtrées
  const [, setFilterModel] = useState({ items: [] });
  const columns = [
    { field: "id_vente", headerName: "ID Vente", width: 150 },
    { field: "id_vente_detail", headerName: "ID Vente Detail", width: 180 },
    { field: "nom", headerName: "Nom", width: 180 },
    { field: "forme", headerName: "Forme", width: 150 },
    { field: "dosage", headerName: "Dosage", width: 180 },
    { field: "quantite_vendue", headerName: "Quantité Vendue", width: 200 },
    { field: "prix_unitaire", headerName: "Prix Unitaire", width: 150 },
    { field: "montant_vente", headerName: "Montant Vente", width: 180 },
    { field: "mode_paiement", headerName: "Mode de paiement", width: 180 },
  ];
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5001/vente", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Données récupérées:", response.data);
        const formattedRows = response.data.map((item) => ({
          id: `${item.id_vente}-${item.id_vente_detail}`,
          id_vente: item.id_vente,
          id_vente_detail: item.id_vente_detail,
          nom: item.nom,
          forme: item.forme,
          dosage: item.dosage,
          quantite_vendue: item.quantite_vendue,
          prix_unitaire: item.prix_unitaire,
          montant_vente: item.montant_vente,
          mode_paiement: item.mode_paiement,
        }));
        setRows(formattedRows);
        setFilteredRows(formattedRows); // Afficher toutes les lignes sans filtrage initial
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données:", error);
      });
  }, [token]);

  // Calculer le montant total
  const totalMontantVente = filteredRows.reduce(
    (total, row) => total + (row.montant_vente || 0),
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
        Montant Total: {totalMontantVente.toFixed(2)} CFA
      </div>
    </div>
  );
};

export default VenteA;
