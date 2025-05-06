import axios from "axios";
import React, { useEffect, useState } from "react";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./Soins.scss";
import Swal from "sweetalert2";

const Soins = () => {
  const [formData, setFormData] = useState({
    type_soin: "",
    prix: "",
    departement: "",
  });

  const [isLoading, setIsLoading] = useState(false); // Ajout de l'état de chargement
  const [errorMessage, setErrorMessage] = useState(""); // Ajout pour afficher les erreurs
  const token = localStorage.getItem("token");
  // Options pour le type de soin

  const [departementOption, setdepartementOption] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/departements",{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setdepartementOption(res.data);
        } else {
          console.error(
            "La réponse ne contient pas un tableau de soins valide"
          );
          setdepartementOption([]); // Définit un tableau vide en cas d'erreur
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des soins", err);
        setdepartementOption([]); // Définit un tableau vide en cas d'échec
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

  // Vérifier si le type de soin existe déjà
  const checkIfSoinExists = async (type_soin) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/soins/${type_soin}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.exists; // Supposons que l'API renvoie { exists: true } ou { exists: false }
    } catch (error) {
      console.log("Erreur lors de la vérification du soin : ", error);
      return false; // En cas d'erreur, on assume que le soin n'existe pas
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier si le prix est un nombre valide
    if (isNaN(formData.prix) || formData.prix.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Veuillez entrer un prix valide.",
        confirmButtonText: "OK",
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(""); // Réinitialiser le message d'erreur lors d'une nouvelle soumission

    // Vérifier si le soin existe déjà dans la base de données
    const soinExists = await checkIfSoinExists(formData.type_soin);

    if (soinExists) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Le soin existe déjà dans la base de données.",
        confirmButtonText: "OK",
      });
      setIsLoading(false);
    } else {
      // Si le soin n'existe pas, on l'envoie à la base de données
      axios
        .post("http://localhost:5001/soins", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          Swal.fire({
            icon: "success",
            title: "Succès",
            text: "Le soin a été créé avec succès!",
            confirmButtonText: "OK",
          });
          // Réinitialiser les champs après soumission
          setFormData({
            type_soin: "",
            prix: "",
            departement: "",
          });
        })
        .catch((err) => {
          setErrorMessage("Une erreur s'est produite lors de l'ajout du soin.");
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "Une erreur s'est produite lors de l'ajout du soin.",
            confirmButtonText: "OK",
          });
          console.log(err);
        })
        .finally(() => setIsLoading(false)); // Désactiver l'indicateur de chargement
    }
  };

  return (
    <div className="infirm">
      <Navbar />
      <Sidebar />
      <div className="container">
        <form onSubmit={handleSubmit} className="patient-form">
          <h2>Ajouter un soin</h2>

          {/* Affichage des erreurs */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="prenom">Type de soin :</label>
                <input
                  type="text"
                  id="type_soin"
                  name="type_soin"
                  value={formData.type_soin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="nom">Prix :</label>
                <input
                  type="text"
                  id="prix"
                  name="prix"
                  value={formData.prix}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div>
              <label htmlFor="departement">Département :</label>
              <select
                id="departement"
                name="departement"
                value={formData.departement}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionnez un département --</option>
                {Array.isArray(departementOption) &&
                    departementOption.map((departements, index) => (
                      <option key={index} value={departements.departement}>
                        {departements.departement}
                      </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicateur de chargement */}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "En cours..." : "Soumettre"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Soins;
