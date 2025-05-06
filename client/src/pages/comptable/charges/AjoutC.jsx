import axios from "axios";
import React, { useState } from "react";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./AjoutC.scss";
import Swal from "sweetalert2";

const AjouC = () => {
  const [formData, setFormData] = useState({
    charge: "",
    montant: "",
    description: "",
    date: "",
    type_charge: "Débit", // Valeur par défaut
    type_caisse: "Caisse", // Valeur par défaut
    provenance: "", // Nouveau champ Provenance
    fichie_joint: "",
  });

  // Gestion des changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const token = localStorage.getItem("token");

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("charge", formData.charge);
    formDataToSend.append("montant", formData.montant);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("type_charge", formData.type_charge);
    formDataToSend.append("type_caisse", formData.type_caisse);
    formDataToSend.append("provenance", formData.provenance);
    if (formData.fichie_joint) {
      formDataToSend.append("fichie_joint", formData.fichie_joint);
    }

    axios
      .post("http://localhost:5001/ajouter-charge", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Réponse du serveur : ", res); // Affichage de la réponse complète pour déboguer

        if (res.status === 201) {
          // Vérification du code de réponse du serveur
          setFormData({
            charge: "",
            montant: "",
            description: "",
            date: "",
            type_charge: "Débit",
            type_caisse: "Caisse",
            provenance: "",
            fichie_joint: "",
          });
          document.getElementById("fichie_joint").value = "";

          Swal.fire({
            title: "Succès !",
            text: "La charge a été ajoutée avec succès.",
            icon: "success",
            confirmButtonText: "OK",
          });
        } else {
          console.log("Erreur dans la réponse du serveur");
          Swal.fire({
            title: "Erreur",
            text: "Une erreur est survenue lors de l'ajout de la charge.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      })
      .catch((err) => {
        console.log("Erreur lors de la soumission du formulaire :", err);
        if (err.response) {
          Swal.fire({
            title: "Erreur",
            text: err.response.data.error || "Une erreur est survenue.",
            icon: "error",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            title: "Erreur",
            text: "Une erreur inconnue est survenue.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      });      
  };

  return (
    <div className="infirm">
      <Navbar />
      <Sidebar />
      <div className="container">
        <form onSubmit={handleSubmit} className="patient-form">
          <h2>Ajouter une charge</h2>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="charge">Charge :</label>
                <input
                  type="text"
                  id="charge"
                  name="charge"
                  value={formData.charge}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="montant">Montant :</label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="description">Description :</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="date">Date :</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="type_charge">Type de charge :</label>
                <select
                  id="type_charge"
                  name="type_charge"
                  value={formData.type_charge}
                  onChange={handleChange}
                  required
                >
                  <option value="Débit">Débit</option>
                  <option value="Crédit">Crédit</option>
                </select>
              </div>
              <div>
                <label htmlFor="type_caisse">Caisse :</label>
                <select
                  id="type_caisse"
                  name="type_caisse"
                  value={formData.type_caisse}
                  onChange={handleChange}
                  required
                >
                  <option value="Caisse">Caisse</option>
                  <option value="Banque">Banque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nouveau champ Provenance */}
          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="provenance">Provenance :</label>
                <input
                  type="text"
                  id="provenance"
                  name="provenance"
                  value={formData.provenance}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="fichie_joint">Fichier joint</label>
                <input
                  type="file"
                  id="fichie_joint"
                  name="fichie_joint"
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      fichie_joint: e.target.files[0],
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-button">
            Soumettre
          </button>
        </form>
      </div>
    </div>
  );
};

export default AjouC;
