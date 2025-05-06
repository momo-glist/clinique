import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const EditS = () => {
  const [salaire, setSalaire] = useState({
    salaire_base: 0,
    salaire_brute: 0,
    inps: 0,
    amo: 0,
  });
  const { id } = useParams();
  const navigate = useNavigate();

  // Charger les données du salaire
  useEffect(() => {
    const fetchSalaire = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/get_salaire/${id}`);
        const salaireData = res.data || {};
        setSalaire({
          salaire_base: salaireData.salaire_base || 0,
          salaire_brute: salaireData.salaire_brute || 0,
          inps: salaireData.inps || 0,
          amo: salaireData.amo || 0,
        });
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Une erreur est survenue lors du chargement des données.",
          confirmButtonText: "OK",
        });
      }
    };
    fetchSalaire();
  }, [id]);

  // Gérer les modifications dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSalaire({ ...salaire, [name]: value });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    const consultationData = {
      salaire_base: salaire.salaire_base,
      salaire_brute: salaire.salaire_brute,
      inps: salaire.inps,
      amo: salaire.amo,
    };

    try {
      await axios.put(
        `http://localhost:5001/update_salaire/${id}`,
        consultationData
      );
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Salaire ajoutée avec succès !",
        confirmButtonText: "OK",
      });
      navigate(-1); // Redirection
    } catch (err) {
      console.error("Erreur lors de la soumission :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue lors de l'ajout de la consultation.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="edit">
      <Navbar />
      <div className="container">
        <form onSubmit={handleSubmit} className="edit-form">
          <h2>Formulaire salaire</h2>
          {[
            { label: "Salaire de base", name: "salaire_base", type: "number" },
            { label: "Salaire brute", name: "salaire_brute", type: "number" },
            { label: "INPS", name: "inps", type: "number" },
            { label: "AMO", name: "amo", type: "number" },
          ].map((field) => (
            <div className="form-group" key={field.name}>
              <label>{field.label} :</label>
              <input
                type={field.type}
                name={field.name}
                value={salaire[field.name] || ""}
                onChange={handleChange}
              />
            </div>
          ))}
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

export default EditS;
