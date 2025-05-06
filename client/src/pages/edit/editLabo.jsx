import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const EditLab = () => {
  const idAdmin = localStorage.getItem("idAdminClinique");
  const [patient, setPatient] = useState({
    prenom: "",
    nom: "",
    age: 0,
    sexe: "",
    telephone: "",
    ethnie: "",
    localite: "",
    type_soin: "",
    nature: "",
    resultat: "",
    renseignement: "",
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
          telephone: patientData.telephone || "",
          ethnie: patientData.ethnie || "",
          localite: patientData.localite || "",
          type_soin: patientData.type_soin || "",
          nature: patientData.nature || "",
          resultat: patientData.resultat || "",
          renseignement: patientData.renseignement || "",
        });
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        alert("Une erreur est survenue lors du chargement des données.");
      }
    };
    fetchPatient();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  const deletePatient = async () => {
    try {
      await axios.delete(`http://localhost:5001/delete_patient/${id}`);
      console.log("Patient supprimé avec succès.");
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de supprimer le patient.");
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation des données
    if (isNaN(patient.age) || patient.age <= 0 || patient.age > 120) {
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "L'âge doit être un nombre valide entre 1 et 120.",
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
  
    const laboData = {
      nom: patient.nom,
      prenom: patient.prenom,
      age: parseInt(patient.age),
      sexe: patient.sexe,
      telephone: patient.telephone,
      ethnie: patient.ethnie,
      localite: patient.localite,
      type_soin: patient.type_soin,
      nature: patient.nature,
      resultat: patient.resultat,
      renseignement: patient.renseignement,
      id_admin_clinique: idAdmin,
    };

    setLoading(true);
  
    try {
      await axios.post("http://localhost:5001/add_labo", laboData, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
      });
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Examen ajouté avec succès !",
        confirmButtonText: "OK",
      });
      await deletePatient();
      navigate(-1);
    } catch (err) {
      console.error("Erreur lors de la soumission :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue lors de l'ajout de l'examen.",
        confirmButtonText: "OK",
      })
      .finally(() => {
        setLoading(false); // Arrête le spinner
      });
    }
  };

  return (
    <div className="edit">
    {loading && (
      <div className="modal">
        <div className="spinner"></div> {/* Animation du spinner */}
        <p>Loading...</p>
      </div>
    )}
      <Navbar />
      <div className="container">
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>Formulaire Patient</h2>
          {[
            { label: "Prénom", name: "prenom", type: "text" },
            { label: "Nom", name: "nom", type: "text" },
            { label: "Âge", name: "age", type: "number" },
            { label: "Sexe", name: "sexe", type: "text" },
            { label: "Telephone", name: "telephone", type: "text" },
            { label: "Ethnie", name: "ethnie", type: "text" },
            { label: "Localité", name: "localite", type: "text" },
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
            <label>Nature :</label>
            <input
              type="text"
              name="nature"
              value={patient.nature || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Resultat :</label>
            <input
              type="text"
              name="resultat"
              value={patient.resultat || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Renseignement :</label>
            <input
              type="text"
              name="renseignement"
              value={patient.renseignement || ""}
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

export default EditLab;
