import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const Editi = () => {
  const [agenda, setAgenda] = useState({
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
    diagnostique: "",
    prescription: "",
    date: "",
    heure: "",
  });
  const { id } = useParams();
  const navigate = useNavigate();

  // Charger les données du agenda
  useEffect(() => {
    axios
      .get(`http://localhost:5001/get_agenda/${id}`)
      .then((res) => {
        const agendaData = res.data[0];

        // Formater la date au format YYYY-MM-DD
        const formattedDate = new Date(agendaData.date);
        const formattedDateString = formattedDate.toISOString().split("T")[0];

        // Inclure id_patient dans l'objet agenda
        setAgenda({
          prenom: agendaData.prenom || "",
          nom: agendaData.nom || "",
          age: agendaData.age || 0,
          sexe: agendaData.sexe || "",
          ethnie: agendaData.ethnie || "",
          telephone: agendaData.telephone || "",
          localite: agendaData.localite || "",
          tension: agendaData.tension || 0,
          temperature: agendaData.temperature || 0,
          poids: agendaData.poids || 0,
          diagnostique: agendaData.diagnostique || "",
          prescription: agendaData.prescription || "",
          date: formattedDateString || "",
          heure: agendaData.heure || "",
          id_patient: agendaData.id_patient || "", // Ajoutez id_patient
          id_admin_clinique: agendaData.id_admin_clinique || "",
        });
      })
      .catch((err) =>
        console.error("Erreur lors de la récupération des données :", err)
      );
  }, [id]);

  // Gérer les modifications dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAgenda({ ...agenda, [name]: value || "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérification de la date
    const today = new Date();
    const inputDate = new Date(agenda.date);

    if (inputDate < today) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur : La date doit être supérieure ou égale à la date actuelle.",
        confirmButtonText: "OK",
      });
      return;
    }

    const agendaData = {
      id_agenda: id,
      nom: agenda.nom,
      prenom: agenda.prenom,
      age: parseInt(agenda.age),
      sexe: agenda.sexe,
      ethnie: agenda.ethnie,
      telephone: agenda.telephone,
      localite: agenda.localite,
      tension: agenda.tension,
      temperature: parseInt(agenda.temperature),
      poids: parseInt(agenda.poids),
      diagnostique: agenda.diagnostique,
      prescription: agenda.prescription,
      date: agenda.date,
      heure: agenda.heure,
      id_admin_clinique: agenda.id_admin_clinique,
      id_patient: agenda.id_patient, // Ajouter l'id_patient ici
    };

    console.log("Données soumises :", agendaData);

    axios
      .put(`http://localhost:5001/update_agenda/${id}`, agendaData)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Rendez-vous enregistrées avec succès !",
          confirmButtonText: "OK",
        });
      })
      .then(() => {
        navigate(-1);
      })
      .catch((err) => console.error("Erreur lors de l'enregistrement :", err));
  };

  return (
    <div className="edit">
      <Navbar />
      <div className="container">
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>Formulaire agenda</h2>
          <div className="form-group">
            <label>Prénom :</label>
            <input
              type="text"
              name="prenom"
              value={agenda.prenom || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Nom :</label>
            <input
              type="text"
              name="nom"
              value={agenda.nom || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Âge :</label>
            <input
              type="number"
              name="age"
              value={agenda.age || 0}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Sexe :</label>
            <input
              type="text"
              name="sexe"
              value={agenda.sexe || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Ethnie :</label>
            <input
              type="text"
              name="ethnie"
              value={agenda.ethnie || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Téléphone :</label>
            <input
              type="tel"
              name="telephone"
              value={agenda.telephone || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Localité :</label>
            <input
              type="text"
              name="localite"
              value={agenda.localite || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Tension :</label>
            <input
              type="number"
              name="tension"
              value={agenda.tension || 0}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Temperature :</label>
            <input
              type="number"
              name="temperature"
              value={agenda.temperature || 0}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Poids :</label>
            <input
              type="number"
              name="poids"
              value={agenda.poids || 0}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Diagnostique :</label>
            <input
              type="text"
              name="diagnostique"
              value={agenda.diagnostique || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Prescription :</label>
            <input
              type="text"
              name="prescription"
              value={agenda.prescription || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Date :</label>
            <input
              type="date"
              name="date"
              value={agenda.date || ""}
              onChange={handleChange}
              required
              min={agenda.date} // Empêcher la sélection d'une date inférieure à la date de l'agenda
            />
          </div>
          <div className="form-group">
            <label>Heure :</label>
            <input
              type="time"
              name="heure"
              value={agenda.heure || ""}
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

export default Editi;
