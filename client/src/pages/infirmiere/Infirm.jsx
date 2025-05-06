import axios from "axios";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Navbar from "../../Components/Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar";
import "./Infirm.scss";

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
    temperature: "",
    poids: "",
  });

  const [suggestions, setSuggestions] = useState({
    prenoms: [],
    noms: [],
    localites: [],
    ethnies: [],
  });
  const token = localStorage.getItem("token");

  const fetchSuggestions = (type, query) => {
    const endpoints = {
      prenom: "http://localhost:5001/prenoms/search",
      nom: "http://localhost:5001/noms/search",
      localite: "http://localhost:5001/localites/search",
      ethnie: "http://localhost:5001/ethnies/search",
    };
    console.log("Fetching suggestions for:", type, "with query:", query);
    console.log("Endpoint URL:", endpoints[type]);

    axios
      .get(endpoints[type], { params: { name: query }})
      .then((res) => {
        setSuggestions((prev) => ({
          ...prev,
          [type + "s"]: res.data.map((item) => item[type]),
        }));
      })
      .catch((err) => {
        console.error(`Erreur lors de la récupération des ${type}s:`, err);
      });
  };

  useEffect(() => {
    fetchSuggestions("prenom", "");
    fetchSuggestions("nom", "");
    fetchSuggestions("localite", "");
    fetchSuggestions("ethnie", "");
  }, []);

  // État pour stocker les soins récupérés depuis le backend
  const [soinsOptions, setSoinsOptions] = useState([]);

  const sexeOptions = ["Homme", "Femme"];

  // Récupérer les soins depuis le backend au montage du composant
  useEffect(() => {
    axios
      .get("http://localhost:5001/soins",{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
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
      });
  }, [token]);

  // Gestion des changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const [loading, setLoading] = useState(false);

  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);

    // Vérification que le téléphone contient uniquement des chiffres
  if (!/^\d+$/.test(formData.telephone)) {
    Swal.fire({
      title: "Numéro invalide !",
      text: "Le numéro de téléphone doit contenir uniquement des chiffres.",
      icon: "warning",
      confirmButtonText: "OK",
    });
    return; // Annule la soumission
  }

  // Vérifier si l'âge ou le poids sont négatifs
  if (formData.age < 0 || formData.poids < 0) {
    // Afficher une alerte SweetAlert si un des champs est négatif
    Swal.fire({
      title: "Erreur !",
      text: "L'âge et le poids doivent être des valeurs positives.",
      icon: "error",
      confirmButtonText: "Réessayer",
    });
    return; // Annuler la soumission du formulaire
  }
  
    // Convertir localite et ethnie en minuscules
    const updatedFormData = {
      ...formData,
      localite: formData.localite.trim().toLowerCase(),
      ethnie: formData.ethnie.trim().toLowerCase(),
    };
  
    setLoading(true);
  
    axios
      .post("http://localhost:5001/add", updatedFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        Swal.fire({
          title: "Succès !",
          text: "Patient enregistré avec succès.",
          icon: "success",
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
          temperature: "",
          poids: "",
        });
        console.log(res);
      })
      .catch((err) => {
        Swal.fire({
          title: "Erreur !",
          text: "Une erreur s'est produite lors de l'enregistrement.",
          icon: "error",
          confirmButtonText: "Réessayer",
        });
        console.log(err);
      })
      .finally(() => {
        setLoading(false); // Arrête le spinner
      });
  };  

  return (
    <div className="infirm">
      {loading && (
        <div className="modal">
          <div className="spinner"></div> {/* Animation du spinner */}
          <p>Loading...</p>
        </div>
      )}
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
                  list="prenoms"
                  required
                />
                <datalist id="prenoms">
                  {suggestions.prenoms.map((prenom, i) => (
                    <option key={i} value={prenom} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="nom">Nom :</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  list="noms"
                  required
                />
                <datalist id="noms">
                  {suggestions.noms.map((nom, i) => (
                    <option key={i} value={nom} />
                  ))}
                </datalist>
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
                  list="ethnies"
                  required
                />
                <datalist id="ethnies">
                  {suggestions.ethnies.map((ethnie, i) => (
                    <option key={i} value={ethnie} />
                  ))}
                </datalist>
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
                  list="localites"
                  required
                />
                <datalist id="localites">
                  {suggestions.localites.map((localite, i) => (
                    <option key={i} value={localite} />
                  ))}
                </datalist>
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

            <div className="row">
              <div>
                <label htmlFor="temperature">Temperature :</label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="poids">poids :</label>
                <input
                  type="number"
                  id="poids"
                  name="poids"
                  value={formData.poids}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
