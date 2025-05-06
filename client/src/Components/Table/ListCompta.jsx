import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx"; // Importer la bibliothèque xlsx
import "./ListVF.scss"; // Importer le fichier SCSS
import DeleteIcon from "@mui/icons-material/Delete";

const ListCompta = () => {
  const [rows, setRows] = useState([]); // Données brutes
  const [filteredRows, setFilteredRows] = useState([]); // Données filtrées
  const [year, setYear] = useState(new Date().getFullYear()); // Année sélectionnée
  const [month, setMonth] = useState(new Date().getMonth() + 1); // Mois sélectionné (1-12)
  const token = localStorage.getItem("token");

  // Fonction de suppression
  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette charge ?")) {
      axios
        .delete(`http://localhost:5001/delete_charge/${id}`)
        .then(() => {
          setRows((prevRows) => {
            const updatedRows = prevRows.filter((row) => row.id !== id);
            setFilteredRows(updatedRows);  // Mise à jour de filteredRows
            return updatedRows;  // Retourner les lignes mises à jour
          });
        })
        .catch((error) => console.error("Erreur lors de la suppression :", error));
    }
  };  

  const [columns] = useState([
    { field: "date", headerName: "Date", width: 150 },
    { field: "charges", headerName: "Charges", width: 200 },
    { field: "description", headerName: "Description", width: 250 },
    {
      field: "caisseDebit",
      headerName: "Caisse Débit",
      width: 150,
      type: "number",
    },
    {
      field: "caisseCredit",
      headerName: "Caisse Crédit",
      width: 150,
      type: "number",
    },
    {
      field: "banqueDebit",
      headerName: "Banque Débit",
      width: 150,
      type: "number",
    },
    {
      field: "banqueCredit",
      headerName: "Banque Crédit",
      width: 150,
      type: "number",
    },
    {
      field: "fichie_joint",
      headerName: "Fichier joint",
      width: 200,
      renderCell: (params) => {
        // Vérifier si un lien existe
        if (params.value) {
          const fileName = params.value.split('/').pop(); // Récupérer le nom du fichier à partir de l'URL
          return (
            <a
              href={`http://localhost:5001/telecharger/${fileName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Télécharger
            </a>
          );
        }
        return "";
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
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chargesResponse = await axios.get(
          `http://localhost:5001/charges/${year}/${month}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const consultationsResponse = await axios.get(
          `http://localhost:5001/consultations/${year}/${month}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const ventesResponse = await axios.get(
          `http://localhost:5001/ventes/${year}/${month}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const achatsResponse = await axios.get(
          `http://localhost:5001/historique_achats/${year}/${month}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const paiementsResponse = await axios.get(
          `http://localhost:5001/paiements/${year}/${month}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const totalConsultations =
          consultationsResponse.data.consultations || [];

        const formattedRows = chargesResponse.data.map((item) => {
          let caisseDebit = 0;
          let caisseCredit = 0;
          let banqueDebit = 0;
          let banqueCredit = 0;
          let description = "";
          let fichie_joint = item.fichie_joint; // Lien vers le fichier joint

          if (
            item.provenance === "Caisse" &&
            item.type_charge === "Débit" &&
            item.type_caisse === "Banque"
          ) {
            caisseCredit = item.montant;
            banqueDebit = item.montant;
            description = item.description;
          } else if (
            item.provenance === "Banque" &&
            item.type_charge === "Débit" &&
            item.type_caisse === "Caisse"
          ) {
            caisseDebit = item.montant;
            banqueCredit = item.montant;
            description = item.description;
          } else {
            if (item.type_charge === "Débit") {
              if (item.type_caisse === "Caisse") {
                caisseDebit = item.montant;
                description = item.description;
              } else if (item.type_caisse === "Banque") {
                banqueDebit = item.montant;
                description = item.description;
              }
            } else if (item.type_charge === "Crédit") {
              if (item.type_caisse === "Caisse") {
                caisseCredit = item.montant;
                description = item.description;
              } else if (item.type_caisse === "Banque") {
                banqueCredit = item.montant;
                description = item.description;
              }
            }
          }

          return {
            id: item.id,
            date: new Date(item.date).toLocaleDateString("fr-FR"),
            charges: item.charge,
            description: description,
            caisseDebit: caisseDebit,
            caisseCredit: caisseCredit,
            banqueDebit: banqueDebit,
            banqueCredit: banqueCredit,
            fichie_joint: fichie_joint, // Lien vers le fichier joint
          };
        });

        ventesResponse.data.forEach((vente) => {
          formattedRows.push({
            id: `vente-${vente.id_vente}`,
            date: new Date(vente.date).toLocaleDateString("fr-FR"),
            charges: `Vente Pharmacie ${vente.id_vente}`,
            caisseDebit: vente.montant_total,
            caisseCredit: 0,
            banqueDebit: 0,
            banqueCredit: 0,
          });
        });

        totalConsultations.forEach((consultation) => {
          formattedRows.push({
            id: `consultation-${consultation.id}`,
            date: new Date(consultation.date).toLocaleDateString("fr-FR"),
            charges: `${consultation.type_soin}`,
            caisseDebit: consultation.montant || 0,
            caisseCredit: 0,
            banqueDebit: 0,
            banqueCredit: 0,
          });
        });

        achatsResponse.data.forEach((achat) => {
          formattedRows.push({
            id: `achat-${achat.id_achat}`,
            date: new Date(achat.date_achat).toLocaleDateString("fr-FR"),
            charges: `Achat ${achat.nom_medicament}`,
            caisseDebit: 0,
            caisseCredit: achat.total_achat,
            banqueDebit: 0,
            banqueCredit: 0,
          });
        });

        paiementsResponse.data.forEach((paiement) => {
          formattedRows.push({
            id: `paiement-${paiement.id_paiement}`,
            date: new Date(paiement.date_paiement).toLocaleDateString("fr-FR"),
            charges: "Paiement",
            caisseDebit: 0,
            caisseCredit: paiement.montant_total,
            banqueDebit: 0,
            banqueCredit: 0,
          });
        });

        formattedRows.sort((a, b) => new Date(a.date) - new Date(b.date));

        setRows(formattedRows);
        setFilteredRows(formattedRows);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData();
  }, [year, month, token]);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comptabilité");
    XLSX.writeFile(workbook, "compta_data.xlsx");
  };

  const handleFilterChange = (model) => {
    const filtered = rows.filter((row) => {
      return model.items.every((filter) => {
        const field = filter.columnField;
        const value = filter.value;
        if (value) {
          return row[field]
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        return true;
      });
    });
    setFilteredRows(filtered);
  };

  // Calcul des recettes
  const totalCaisseDebit = filteredRows.reduce(
    (total, row) => total + (row.caisseDebit || 0),
    0
  );
  const totalCaisseCredit = filteredRows.reduce(
    (total, row) => total + (row.caisseCredit || 0),
    0
  );
  const totalBanqueDebit = filteredRows.reduce(
    (total, row) => total + (row.banqueDebit || 0),
    0
  );
  const totalBanqueCredit = filteredRows.reduce(
    (total, row) => total + (row.banqueCredit || 0),
    0
  );

  const recetteCaisse = totalCaisseDebit - totalCaisseCredit;
  const recetteBanque = totalBanqueDebit - totalBanqueCredit;

  return (
    <div>
      <div className="filters">
        <label>
          Année :
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
        </label>

        <label>
          Mois :
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Tableau des données */}
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          onFilterModelChange={handleFilterChange}
        />
      </div>

      {/* Conteneur des éléments en bas */}
      <div className="bottom-content">
        <div
          className={`recette ${recetteCaisse < 0 ? "negative" : "positive"}`}
        >
          <strong>Recette Caisse : {recetteCaisse.toFixed(2)} CFA</strong>
        </div>
        <div
          className={`recette ${recetteBanque < 0 ? "negative" : "positive"}`}
        >
          <strong>Recette Banque : {recetteBanque.toFixed(2)} CFA</strong>
        </div>
      </div>
      <button onClick={handleExport} className="export-button">
        Exporter en Excel
      </button>
    </div>
  );
};

export default ListCompta;

