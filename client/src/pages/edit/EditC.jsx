import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const EditC = () => {
  const [idAdmin, setIdAdmin] = useState(localStorage.getItem("idAdminClinique") || null);
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
    type_soin: "",
    diagnostique: "",
    prescription: "",
    fichier: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Charger les données du agenda
  useEffect(() => {
    axios
      .get(`http://localhost:5001/get_agenda/${id}`)
      .then((res) => {
        const agendaData = res.data[0];
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
          type_soin: agendaData.type_soin || "",
          diagnostique: agendaData.diagnostique || "",
          prescription: agendaData.prescription || "",
          fichier: agendaData.fichier || "",
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

  // Supprimer le agenda de la base de données
  const deleteAgenda = () => {
    axios
      .delete(`http://localhost:5001/delete_agenda/${id}`)
      .then(() => {
        console.log("Agenda supprimé avec succès");
      })
      .catch((err) =>
        console.error("Erreur lors de la suppression du agenda :", err)
      );
  };

  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("ID de l'administrateur :", idAdmin);

    // Vérification que 'age' est un nombre valide
    if (isNaN(agenda.age) || agenda.age <= 0) {
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "L'âge doit être un nombre valide.",
        confirmButtonText: "OK",
      });
    }

    const formData = new FormData();
    formData.append("id_patient", id);
    formData.append("nom", agenda.nom);
    formData.append("prenom", agenda.prenom);
    formData.append("age", parseInt(agenda.age));
    formData.append("sexe", agenda.sexe);
    formData.append("ethnie", agenda.ethnie);
    formData.append("telephone", agenda.telephone);
    formData.append("localite", agenda.localite);
    formData.append("tension", agenda.tension);
    formData.append("temperature", parseInt(agenda.temperature));
    formData.append("poids", parseInt(agenda.poids));
    formData.append("type_soin", agenda.type_soin);
    formData.append("diagnostique", agenda.diagnostique);
    formData.append("prescription", agenda.prescription);
    formData.append("date", agenda.date);
    formData.append("heure", agenda.heure);
    formData.append("id_admin_clinique", idAdmin);
    if (agenda.fichier) {
      formData.append("fichier", agenda.fichier);
    }
    
    axios
      .post("http://localhost:5001/add_consultation/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Consultation ajoutée avec succès !",
          confirmButtonText: "OK",
        });
        deleteAgenda();
        navigate(-1);
      })
      .catch((err) => console.error("Erreur lors de la mise à jour :", err));    
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
              readOnly
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
              readOnly
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
            <label>Type de soin :</label>
            <input
              type="text"
              name="type_soin"
              value={agenda.type_soin || ""}
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
            <label>fichier joint :</label>
            <input
              type="file"
              name="fichier"
              onChange={(e) =>
                setAgenda({ ...agenda, fichier: e.target.files[0] })
              }
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

export default EditC;
