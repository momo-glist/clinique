import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./Ajout.scss";
import Swal from "sweetalert2";

const Ajou = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    forme: "",
    dosage: "",
    posologie: "",
    stock_courant: "",
    prix_unitaire: "",
    date_peremption: "",
    prix_achat: "",
    date_achat: "",
    fournisseur: "",
    num_fournisseur: "",
  });

  const [suggestions, setSuggestions] = useState({
    noms: [],
    formes: [],
    dosages: [],
    posologies: [],
  });
  const token = localStorage.getItem("token");

  const fetchSuggestions = useCallback((type, query) => {
    const endpoints = {
      nom: "http://localhost:5001/medicaments/search",
      forme: "http://localhost:5001/formes/search",
      dosage: "http://localhost:5001/dosages/search",
      posologie: "http://localhost:5001/posologies/search",
    };
  
    if (!endpoints[type]) {
      console.log(`Type de recherche invalide: ${type}`);
      return;
    }
  
    axios
      .get(endpoints[type], {
        params: { name: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setSuggestions((prev) => ({
          ...prev,
          [type + "s"]: res.data.map((item) => item[type]),
        }));
      })
      .catch((err) => {
        console.log(`Erreur lors de la récupération du ${type} :`, err);
      });
  }, [token]);  // Ajoutez token comme dépendance si nécessaire
  
  useEffect(() => {
    fetchSuggestions("nom", "");
    fetchSuggestions("forme", "");
    fetchSuggestions("dosage", "");
    fetchSuggestions("posologie", "");
  }, [fetchSuggestions]);  // Pas besoin de l'ajouter ici si vous utilisez useCallback
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    axios
      .post("http://localhost:5001/ajouter-medicament", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setFormData({
          nom: "",
          forme: "",
          dosage: "",
          posologie: "",
          stock_courant: "",
          prix_unitaire: "",
          date_peremption: "",
          prix_achat: "",
          date_achat: "",
          fournisseur: "",
          num_fournisseur: "",
        });
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Médicament ajouté avec succès",
          confirmButtonText: "OK",
        });
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="infirm">
      <Navbar />
      <Sidebar />
      <div className="container">
        <form onSubmit={handleSubmit} className="patient-form">
          <h2>Formulaire Médicament</h2>

          {isLoading && <div className="loader">Chargement...</div>}

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="nom">Nom :</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  list="noms"
                />
                <datalist id="noms">
                  {suggestions.noms.map((nom, i) => (
                    <option key={i} value={nom} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="forme">Forme :</label>
                <input
                  type="text"
                  id="forme"
                  name="forme"
                  value={formData.forme}
                  onChange={handleChange}
                  required
                  list="formes"
                />
                <datalist id="formes">
                  {suggestions.formes.map((forme, i) => (
                    <option key={i} value={forme} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="dosage">Dosage :</label>
                <input
                  type="text"
                  id="dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  required
                  list="dosages"
                />
                <datalist id="dosages">
                  {suggestions.dosages.map((dosage, i) => (
                    <option key={i} value={dosage} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="posologie">Posologie :</label>
                <input
                  type="text"
                  id="posologie"
                  name="posologie"
                  value={formData.posologie}
                  onChange={handleChange}
                  required
                  list="posologies"
                />
                <datalist id="posologies">
                  {suggestions.posologies.map((posologie, i) => (
                    <option key={i} value={posologie} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="stock_courant">Stock :</label>
                <input
                  type="text"
                  id="stock_courant"
                  name="stock_courant"
                  value={formData.stock_courant}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="prix_unitaire">Prix unitaire :</label>
                <input
                  type="number"
                  id="prix_unitaire"
                  name="prix_unitaire"
                  value={formData.prix_unitaire}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row">
              <div>
                <label htmlFor="date_peremption">Date de péremption :</label>
                <input
                  type="date"
                  id="date_peremption"
                  name="date_peremption"
                  value={formData.date_peremption}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="prix_achat">Prix d'achat :</label>
                <input
                  type="number"
                  id="prix_achat"
                  name="prix_achat"
                  value={formData.prix_achat}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label htmlFor="fournisseur">Nom du fournisseur :</label>
                <input
                  type="text"
                  id="fournisseur"
                  name="fournisseur"
                  value={formData.fournisseur}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="num_fournisseur">Numéro du fournisseur :</label>
                <input
                  type="text"
                  id="num_fournisseur"
                  name="num_fournisseur"
                  value={formData.num_fournisseur}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="code-infirmier-container">
              <div className="code-infirmier-input">
                <label htmlFor="date_achat">Date d'achat :</label>
                <input
                  type="date"
                  id="date_achat"
                  name="date_achat"
                  value={formData.date_achat}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Soumission en cours..." : "Soumettre"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Ajou;
