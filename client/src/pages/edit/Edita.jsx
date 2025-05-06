import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const EditA = () => {
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
    date: "",
    heure: "",
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Charger les données du patient
  useEffect(() => {
    console.log("ID récupéré depuis les paramètres :", id);
    const fetchPatientData = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/get_patient/${id}`);
        console.log("Réponse du serveur :", res.data);
        const patientData = res.data; // Utiliser res.data directement
        if (patientData) {
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
            date: patientData.date || "",
            heure: patientData.heure || "",
          });
        } else {
          console.error("Aucun patient trouvé avec cet ID");
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "Aucun patient trouvé avec cet ID.",
            confirmButtonText: "OK",
          });
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: err.response
            ? err.response.data
            : "Erreur lors de la récupération des données",
          confirmButtonText: "OK",
        });
      }
    };

    fetchPatientData();
  }, [id]);

  // Gérer les modifications dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value || "" });
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

  // Supprimer le patient de la base de données
  const deletePatient = async () => {
    try {
      const response = await axios.delete(
        `http://localhost:5001/delete_patient/${id}`
      );
      if (response.status === 200) {
        console.log("Patient supprimé avec succès.");
        alert("Patient supprimé avec succès.");
        navigate(-1); // Rediriger après la suppression si nécessaire
      } else {
        console.error("Erreur lors de la suppression, réponse inattendue.");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("ID de l'administrateur :", idAdmin);

    if (!idAdmin) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Veuillez saisir un ID valide pour le médecin.",
        confirmButtonText: "OK",
      });
      return;
    }

    const today = new Date();
    const inputDate = new Date(patient.date);

    if (inputDate <= today) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur : La date doit être supérieure à aujourd'hui.",
        confirmButtonText: "OK",
      });
      return;
    }

    const formData = new FormData();
    formData.append("id_patient", parseInt(id));
    formData.append("nom", patient.nom);
    formData.append("prenom", patient.prenom);
    formData.append("age", parseInt(patient.age));
    formData.append("sexe", patient.sexe);
    formData.append("ethnie", patient.ethnie);
    formData.append("telephone", patient.telephone);
    formData.append("localite", patient.localite);
    formData.append("tension", parseInt(patient.tension));
    formData.append("temperature", parseInt(patient.temperature));
    formData.append("poids", parseInt(patient.poids));
    formData.append("type_soin", patient.type_soin);
    formData.append("diagnostique", patient.diagnostique);
    formData.append("prescription", patient.prescription);
    formData.append("id_admin_clinique", idAdmin);
    formData.append("date", patient.date);
    formData.append("heure", patient.heure);

    console.log("Données envoyées pour agenda :", formData);

    try {
      // Ajout dans l'agenda
      await axios.post(
        `http://localhost:5001/add_agenda/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Insertion réussie dans agenda");
    
      // Suppression du patient après insertion dans l'agenda
      await deletePatient(); // Supprimer le patient seulement après l'ajout dans l'agenda
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Patient ajouté à l'agenda et supprimé avec succès.",
        confirmButtonText: "OK",
      });
      navigate(-1); // Redirection après succès
    } catch (err) {
      console.error("Erreur :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.response?.data?.message
          ? err.message
          : "Erreur lors de l'enregistrement ou de la suppression",
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
          {/* Champs du formulaire */}
          {[
            { label: "Prénom", name: "prenom", readOnly: true },
            { label: "Nom", name: "nom", readOnly: true },
            { label: "Âge", name: "age", type: "number", readOnly: true },
            { label: "Sexe", name: "sexe" },
            { label: "Ethnie", name: "ethnie" },
            {
              label: "Téléphone",
              name: "telephone",
              type: "tel",
              readOnly: true,
            },
            { label: "Localité", name: "localite", readOnly: true },
            {
              label: "Tension",
              name: "tension",
              type: "number",
              readOnly: true,
            },
            {
              label: "Temperature",
              name: "temperature",
              type: "number",
            },
            {
              label: "Poids",
              name: "poids",
              type: "number",
            },
            { label: "Type de soin", name: "type_soin", readOnly: true },
            { label: "Diagnostique", name: "diagnostique" },
            { label: "Prescription", name: "prescription" },
            { label: "Date", name: "date", type: "date" },
            { label: "Heure", name: "heure", type: "time" },
          ].map(({ label, name, type = "text", readOnly = false }) => (
            <div className="form-group" key={name}>
              <label>{label} :</label>
              <input
                type={type}
                name={name}
                value={patient[name] || ""}
                onChange={handleChange}
                required
                readOnly={readOnly}
              />
            </div>
          ))}
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

export default EditA;
