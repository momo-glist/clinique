import React, { useState } from "react";
import "./Auth.scss";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const Auth = () => {
  const [telephone, setTelephone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!telephone || !code) {
      return Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Veuillez entrer votre numéro de téléphone et le code administrateur.",
        confirmButtonText: "OK",
      });
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5001/auth", {
        telephone,
        code_admin: code,
      });

      if (response.data.isValid) {
        const { token, redirectPage, idClinique, idAdminClinique } = response.data;

        // Stocker les informations dans localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("idClinique", idClinique);
        localStorage.setItem("idAdminClinique", idAdminClinique);

        // Redirection
        navigate(redirectPage);
      } else {
        if (response.data.error === "La clinique à laquelle vous êtes affilié n'est pas active.") {
          Swal.fire({
            icon: "warning",
            title: "Clinique Inactive",
            text: "La clinique à laquelle vous êtes affilié n'est pas active. Veuillez contacter l'administration.",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: response.data.error || "Identifiants incorrects.",
            confirmButtonText: "OK",
          });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      if (err.response) {
        console.error("Détails de l'erreur :", err.response.data);
      }
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur de connexion au serveur. Veuillez réessayer plus tard.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="header">
        <div className="text">Clinique</div>
        <div className="underline"></div>
      </div>
      <form className="inputs" onSubmit={handleLogin}>
        <div className="input">
          <input
            type="text"
            placeholder="Numéro de téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            aria-label="Numéro de téléphone"
            disabled={loading}
          />
        </div>
        <div className="input">
          <input
            type="password"
            placeholder="Entrez le code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Code administrateur"
            disabled={loading}
          />
        </div>
        <div className="submit-container">
          <button className="submit" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Connexion"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Auth;


