import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const Edit = () => {
  const [idAdmin, setIdAdmin] = useState(localStorage.getItem("idAdminClinique") || null);
  const [patient, setPatient] = useState({
    prenom: "",
    nom: "",
    age: 0,
    sexe: "",
    ethnie: "",
    telephone: "",
    localite: "",
    tension: 0,
    temperature: 0,
    poids: 0,
    type_soin: "",
    diagnostique: "",
    prescription: "",
    fichier: "",
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Charger les données du patient
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/get_patient/${id}`);
        const patientData = res.data || {};
        setPatient({
          prenom: patientData.prenom || "",
          nom: patientData.nom || "",
          age: patientData.age || 0,
          sexe: patientData.sexe || "",
          ethnie: patientData.ethnie || "",
          telephone: patientData.telephone || "",
          localite: patientData.localite || "",
          tension: patientData.tension || 0,
          temperature: patientData.temperature || 0,
          poids: patientData.poids || 0,
          type_soin: patientData.type_soin || "",
          diagnostique: patientData.diagnostique || "",
          prescription: patientData.prescription || "",
          fichier: patientData.fichier || "",
        });
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        alert("Une erreur est survenue lors du chargement des données.");
      }
    };
    fetchPatient();
  }, [id]);

  // Gérer les modifications dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  useEffect(() => {
    // Récupération de l'ID admin avec la bonne clé 'idAdmin'
    const idFromStorage = localStorage.getItem("idAdminClinique");
    console.log("ID admin récupéré du localStorage :", idFromStorage); // Log pour vérifier

    if (idFromStorage) {
      setIdAdmin(idFromStorage); // Mettre à jour l'état avec l'ID
    } else {
      console.log("Aucun ID admin trouvé dans localStorage.");
    }
  }, []);

  // Fonction pour supprimer le patient
  const deletePatient = async () => {
    try {
      await axios.delete(`http://localhost:5001/delete_patient/${id}`);
      console.log("Patient supprimé avec succès.");
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de supprimer le patient.");
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNaN(patient.age) || patient.age <= 0) {
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "L'âge doit être un nombre valide et positif.",
        confirmButtonText: "OK",
      });
    }

    if (!idAdmin) {
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de récupérer l'ID de l'administrateur.",
        confirmButtonText: "OK",
      });
    }

    // ✅ Utilisation de FormData pour inclure le fichier
    const formData = new FormData();
    formData.append("id_patient", id);
    formData.append("nom", patient.nom);
    formData.append("prenom", patient.prenom);
    formData.append("age", patient.age);
    formData.append("sexe", patient.sexe);
    formData.append("ethnie", patient.ethnie);
    formData.append("telephone", patient.telephone);
    formData.append("localite", patient.localite);
    formData.append("tension", patient.tension);
    formData.append("temperature", patient.temperature);
    formData.append("poids", patient.poids);
    formData.append("type_soin", patient.type_soin);
    formData.append("diagnostique", patient.diagnostique);
    formData.append("prescription", patient.prescription);
    formData.append("id_admin_clinique", idAdmin);

    // ✅ On ajoute le fichier uniquement s'il est sélectionné
    if (patient.fichier instanceof File) {
      formData.append("fichier", patient.fichier);
    }

    try {
      await axios.post("http://localhost:5001/add_consultation", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // nécessaire pour envoyer des fichiers
        },
      });

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Consultation ajoutée avec succès !",
        confirmButtonText: "OK",
      });
      await deletePatient();
      navigate(-1);
    } catch (err) {
      console.error("Erreur lors de la soumission :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue lors de l'ajout de la consultation.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="edit">
      <Navbar />
      <div className="container">
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>Formulaire Patient</h2>

          {[
            { label: "Prénom", name: "prenom", type: "text" },
            { label: "Nom", name: "nom", type: "text" },
            { label: "Âge", name: "age", type: "number" },
            { label: "Sexe", name: "sexe", type: "text" },
            { label: "Ethnie", name: "ethnie", type: "text" },
            { label: "Téléphone", name: "telephone", type: "tel" },
            { label: "Localité", name: "localite", type: "text" },
            { label: "Tension", name: "tension", type: "number" },
            { label: "Temperature", name: "temperature", type: "number" },
            { label: "Poids", name: "poids", type: "number" },
            { label: "Type de soin", name: "type_soin", type: "text" },
          ].map((field) => (
            <div className="form-group" key={field.name}>
              <label>{field.label} :</label>
              <input
                type={field.type}
                name={field.name}
                value={patient[field.name] || ""}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="form-group">
            <label>Fichier :</label>
            <input
              type="file"
              name="fichier"
              onChange={(e) =>
                setPatient({ ...patient, fichier: e.target.files[0] })
              }
            />
          </div>

          <div className="form-group">
            <label>Diagnostique :</label>
            <input
              type="text"
              name="diagnostique"
              value={patient.diagnostique || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Prescription :</label>
            <input
              type="text"
              name="prescription"
              value={patient.prescription || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="button">
            <button type="submit" className="submit-button">
              Soumettre
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="submit-button"
            >
              Retourner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit;
