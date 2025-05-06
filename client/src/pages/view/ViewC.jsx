import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./View.scss";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import Swal from "sweetalert2";

const ViewC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState({
    id: "",
    prenom: "",
    nom: "",
    age: 0,
    telephone: "",
    localite: "",
    tension: 0,
    id_medecin: "",
    diagnostique: "",
    prescription: "",
    date: "",
    heure: "",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:5001/view/${id}`)
      .then((response) => {
        const consultationData = response.data;

        // Formatage des données
        const dateTime = new Date(consultationData.date);
        const dateFormatted = dateTime.toISOString().split("T")[0];
        const heureFormatted = dateTime
          .toTimeString()
          .split(" ")[0]
          .slice(0, 5);

        setConsultation({
          ...consultationData,
          date: dateFormatted,
          heure: heureFormatted,
        });
      })
      .catch((error) => {
        console.error(
          "Erreur lors de la récupération de la consultation :",
          error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Une erreur est survenue lors du chargement des données.",
          confirmButtonText: "OK",
        });
      });
  }, [id]);

  return (
    <div className="edit">
      <Navbar />
      <div className="container">
        <form className="edit-form">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="submit-button"
          >
            Retour
          </button>
          <h2>Formulaire du patient consulter</h2>
          <div className="form-group">
            <label>Prénom :</label>
            <input
              type="text"
              name="prenom"
              value={consultation.prenom || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Nom :</label>
            <input
              type="text"
              name="nom"
              value={consultation.nom || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Âge :</label>
            <input
              type="number"
              name="age"
              value={consultation.age || 0}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Téléphone :</label>
            <input
              type="tel"
              name="telephone"
              value={consultation.telephone || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Localité :</label>
            <input
              type="text"
              name="localite"
              value={consultation.localite || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Tension :</label>
            <input
              type="number"
              name="tension"
              value={consultation.tension || 0}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Diagnostique :</label>
            <input
              type="text"
              name="diagnostique"
              value={consultation.diagnostique || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Prescription :</label>
            <input
              type="text"
              name="prescription"
              value={consultation.prescription || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Code du medecin :</label>
            <input
              type="text"
              name="id_admin"
              value={consultation.id_admin || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Date :</label>
            <input
              type="date"
              name="date"
              value={consultation.date || ""}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Heure :</label>
            <input
              type="time"
              name="heure"
              value={consultation.heure || ""}
              readOnly
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewC;
