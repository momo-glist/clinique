import React, { useEffect, useState } from "react";
import "./Create.scss";
import Navbar from "../../../Components/Navbar/Navbar";
import axios from "axios";
import Sidebar from "../Sidebar/Sidebar";
import Swal from "sweetalert2";

const Create = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    sexe: "",
    situation: "",
    telephone: "",
    mail: "",
    departement: "",
    poste: "",
    code_admin: "",
    diplome: "",
    niveau: "",
    date_e: "",
    profil: "",
    identite: "",
    salaire: "",
  });

  const [suggestions, setSuggestions] = useState({
    departement: [],
    poste: [],
  });

  useEffect(() => {
    // Charger les suggestions de départements au premier rendu
    fetchSuggestions("departement", "");
    fetchSuggestions("poste", "");
  }, []);

  const fetchSuggestions = (type, query) => {
    const endpoints = {
      departement: "http://localhost:5001/departements/search",
      poste: "http://localhost:5001/postes/search",
    };
  
    const token = localStorage.getItem("token"); // Récupération du token
  
    axios
      .get(endpoints[type], {
        params: { name: query },
        headers: {
          Authorization: `Bearer ${token}`, // Ajout du token dans les en-têtes
        },
      })
      .then((res) => {
        setSuggestions((prev) => ({
          ...prev,
          [type]: res.data.map((item) => item[type]),
        }));
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Erreur lors de la récupération des departements ou postes !",
          confirmButtonText: "OK",
        });
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Mettre à jour le formulaire localement
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Si on modifie le champ departement, on fetch les suggestions
    if (name === "departement") {
      fetchSuggestions(name, value);
    }
  };

  // Options pour le sexe
  const sexeOptions = ["Homme", "Femme"];

  // Gestion des changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    let newValue = value;
  
    // Supprimer les espaces si l'utilisateur entre un numéro de téléphone
    if (name === "telephone") {
      newValue = value.replace(/\s+/g, ""); // Supprime tous les espaces
    }
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue, 
    }));
  };  

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const cleanedFormData = {
      ...formData,
      poste: formData.poste.trim().toLowerCase(),
      departement: formData.departement.trim().toLowerCase(),
    };
  
    const formDataToSend = new FormData();
    Object.keys(cleanedFormData).forEach((key) => {
      formDataToSend.append(key, cleanedFormData[key]);
    });
  
    console.log("Données envoyées:", cleanedFormData);
  
    const token = localStorage.getItem("token");
  
    axios
      .post("http://localhost:5001/administration", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Réponse du serveur:", res);
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Employé ajouté avec succès",
          confirmButtonText: "OK",
        });
  
        // Réinitialisation du formulaire
        setFormData({
          nom: "",
          prenom: "",
          date_naissance: "",
          sexe: "",
          situation: "",
          telephone: "",
          mail: "",
          departement: "",
          poste: "",
          code_admin: "",
          diplome: "",
          niveau: "",
          date_e: "",
          profil: "",
          identite: "",
          salaire: "",
        });
  
        // Réinitialisation des champs file
        document.getElementById("profil").value = "";
        document.getElementById("identite").value = "";
      })
      .catch((err) => {
        console.log("Erreur lors de la soumission:", err);
  
        if (
          err.response &&
          err.response.status === 400 &&
          err.response.data.message === "Ce numéro de téléphone existe déjà."
        ) {
          Swal.fire({
            icon: "warning",
            title: "Numéro déjà utilisé",
            text: "Ce numéro de téléphone est déjà enregistré dans la clinique.",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "Erreur lors de la soumission !",
            confirmButtonText: "OK",
          });
        }
      });
  };  

  return (
    <div className="create">
      <Sidebar />
      <Navbar />
      <div className="container">
        <form onSubmit={handleSubmit} className="patient-form">
          <h2>Ajouter un Employé</h2>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="prenom">Prénom :</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="nom">Nom :</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="date_naissance">Date de naissance :</label>
                <input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="sexe">Sexe :</label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionnez --</option>
                  {sexeOptions.map((sexe, index) => (
                    <option key={index} value={sexe}>
                      {sexe}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="mail">Mail :</label>
                <input
                  type="email"
                  id="mail"
                  name="mail"
                  value={formData.mail}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="telephone">Téléphone :</label>
                <input
                  type="text"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="poste">Intitutlé du poste :</label>
                <input
                  type="text"
                  id="poste"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  list="poste"
                  required
                />
                <datalist id="poste">
                  {suggestions.poste.map((poste, i) => (
                    <option key={i} value={poste} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="departement">Département :</label>
                <input
                  type="text"
                  id="departement"
                  name="departement"
                  value={formData.departement}
                  onChange={handleInputChange}
                  list="departement-options"
                  required
                />
                <datalist id="departement-options">
                  {suggestions.departement.map((departement, i) => (
                    <option key={i} value={departement} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="diplome">Diplôme :</label>
                <input
                  type="text"
                  id="diplome"
                  name="diplome"
                  value={formData.diplome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="niveau">Niveau :</label>
                <input
                  type="text"
                  id="niveau"
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="situation">Situation matrimoniale :</label>
                <input
                  type="text"
                  id="situation"
                  name="situation"
                  value={formData.situation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="date_e">Date d'embauche :</label>
                <input
                  type="date"
                  id="date_e"
                  name="date_e"
                  value={formData.date_e}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="profil">Profil :</label>
                <input
                  type="file"
                  id="profil"
                  name="profil"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      profil: e.target.files[0],
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label htmlFor="identite">Identité :</label>
                <input
                  type="file"
                  id="identite"
                  name="identite"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      identite: e.target.files[0],
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="salaire">Salaire :</label>
                <input
                  type="number"
                  id="salaire"
                  name="salaire"
                  value={formData.salaire}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="codeAdmin">Code :</label>
                <input
                  type="password"
                  id="codeAdmin"
                  name="code_admin"
                  value={formData.code_admin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <button type="submit" className="submit-button">
              Soumettre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
