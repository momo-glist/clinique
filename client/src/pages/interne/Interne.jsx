import axios from "axios";
import React, { useState, useEffect } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar";
import "./Interne.scss";
import Swal from "sweetalert2";

const Infirm = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    sexe: "",
    ethnie: "",
    telephone: "",
    localite: "",
    type_soin: "",
    code_admin: "",
    tension: "",
  });

  // État pour stocker les soins récupérés depuis le backend
  const [soinsOptions, setSoinsOptions] = useState([]);

  const sexeOptions = ["Homme", "Femme"];

  // Récupérer les soins depuis le backend au montage du composant
  useEffect(() => {
    axios
      .get("http://localhost:5001/soins")
      .then((res) => {
        if (res.data && Array.isArray(res.data.soins)) {
          setSoinsOptions(res.data.soins);
        } else {
          console.error(
            "La réponse ne contient pas un tableau de soins valide"
          );
          setSoinsOptions([]); // Définit un tableau vide en cas d'erreur
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des soins", err);
        setSoinsOptions([]); // Définit un tableau vide en cas d'échec
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Une erreur est survenue lors du chargement des données.",
          confirmButtonText: "OK",
        });
      });
  }, []);

  // Gestion des changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);

    axios
      .post("http://localhost:5001/add", formData)
      .then((res) => {
        alert("Patient enregistré avec succes");
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Patient enregistré avec succes",
          confirmButtonText: "OK",
        });
        // Réinitialiser les champs après soumission
        setFormData({
          nom: "",
          prenom: "",
          age: "",
          sexe: "",
          ethnie: "",
          telephone: "",
          localite: "",
          type_soin: "",
          code_admin: "",
          tension: "",
        });
        console.log(res);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="infirm">
      <Navbar />
      <Sidebar />
      <div className="container">
        <form onSubmit={handleSubmit} className="patient-form">
          <h2>Formulaire Patient</h2>

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
                <label htmlFor="age">Age :</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
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
                  <option value="">-- Sélectionnez le genre--</option>
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
                <label htmlFor="ethnie">Ethnie :</label>
                <input
                  type="text"
                  id="ethnie"
                  name="ethnie"
                  value={formData.ethnie}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="telephone">Téléphone :</label>
                <input
                  type="tel"
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
                <label htmlFor="localite">Localité :</label>
                <input
                  type="text"
                  id="localite"
                  name="localite"
                  value={formData.localite}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="tension">Tension :</label>
                <input
                  type="number"
                  id="tension"
                  name="tension"
                  value={formData.tension}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Nouveau conteneur pour aligner le champ Code infirmier et le bouton sur la même ligne */}
            <div className="code-infirmier-container">
              <div className="code-infirmier-input">
                <label htmlFor="codeInfirmier">Code infirmier :</label>
                <input
                  type="password"
                  id="codeInfirmier"
                  name="code_admin"
                  value={formData.code_admin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="typeSoin">Type de soin :</label>
                <select
                  id="typeSoin"
                  name="type_soin"
                  value={formData.type_soin}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Sélectionnez un soin --</option>
                  {Array.isArray(soinsOptions) &&
                    soinsOptions.map((soin, index) => (
                      <option key={index} value={soin.type_soin}>
                        {soin.type_soin}
                      </option>
                    ))}
                </select>
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

export default Infirm;
