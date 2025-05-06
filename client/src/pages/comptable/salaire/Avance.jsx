import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Avance.scss";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import Swal from "sweetalert2";

const AjouterAvanceSalaire = () => {
  // États pour gérer les valeurs du formulaire
  const [employes, setEmployes] = useState([]); // Liste des employés
  const [idEmploye, setIdEmploye] = useState(""); // ID de l'employé sélectionné
  const [montantAvance, setMontantAvance] = useState(""); // Montant de l'avance
  const [dateAvance, setDateAvance] = useState(""); // Date de l'avance
  const token = localStorage.getItem("token");

  // Récupération des employés depuis l'API backend
  useEffect(() => {
    const fetchEmployes = async () => {
      try {
        const response = await axios.get("http://localhost:5001/employes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEmployes(response.data); // Sauvegarde la liste des employés
      } catch (error) {
        console.error("Erreur lors de la récupération des employés", error);
        return Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de récupérer la liste des employés.",
          confirmButtonText: "OK",
        });
      }
    };
    fetchEmployes();
  }, [token]);

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs
    if (!idEmploye || !montantAvance || !dateAvance) {
      return Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Tous les champs sont obligatoires.",
        confirmButtonText: "OK",
      });
    }

    // Préparation des données à envoyer à l'API
    const avanceData = {
      id_admin_clinique: idEmploye, // Envoie l'ID de l'employé sélectionné
      montant_avance: parseFloat(montantAvance),
      date_avance: dateAvance,
    };

    try {
      // Envoi de la requête POST pour ajouter l'avance
      const response = await axios.post(
        "http://localhost:5001/avance_salaire",
        avanceData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Avance ajoutée avec succès !",
          confirmButtonText: "OK",
        });

        // Réinitialiser les champs du formulaire après soumission
        setIdEmploye("");
        setMontantAvance("");
        setDateAvance("");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'avance", error);
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur lors de l'ajout de l'avance. Veuillez réessayer.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="infirm">
      <Navbar />
      <Sidebar />
      <div className="container">
        <div className="ajouter-avance">
          <h2>Ajouter une avance sur salaire</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="employeSelect">Sélectionner un employé</label>
              <select
                id="employeSelect"
                value={idEmploye}
                onChange={(e) => setIdEmploye(e.target.value)}
                className="form-control"
                required
              >
                <option value="">Sélectionner un employé</option>
                {employes.map((employe) => (
                  <option key={employe.id_admin_clinique} value={employe.id_admin_clinique}>
                    {employe.nom} {employe.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="montantAvance">Montant de l'avance</label>
              <input
                type="number"
                id="montantAvance"
                value={montantAvance}
                onChange={(e) => setMontantAvance(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateAvance">Date de l'avance</label>
              <input
                type="date"
                id="dateAvance"
                value={dateAvance}
                onChange={(e) => setDateAvance(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Ajouter l'avance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AjouterAvanceSalaire;
