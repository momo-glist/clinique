import React, { useEffect, useState } from "react";
import "./Edit.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Components/Navbar/Navbar";
import Swal from "sweetalert2";

const EditAdmin = () => {
  const [admin, setAdmin] = useState({
    prenom: "",
    code_admin: "",
    nombre_consultation: "",
    nom: "",
    date_naissance: "",
    profil: "",
    identite: "",
    sexe: "",
    situation: "",
    telephone: "",
    diplome: "",
    niveau: "",
    departement: "",
    poste: "",
    mail: "",
    salaire_brute: 0,
    date_e: "",
  });
  const { idAdminClinique } = useParams();
  console.log("🔍 ID récupéré depuis l'URL :", idAdminClinique);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Charger les données de l'administration
  useEffect(() => {
    axios
      .get(`http://localhost:5001/get_admin/${idAdminClinique}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Données reçues :", res.data);
  
        // Vérification si la réponse est vide
        if (!res.data || res.data.length === 0) {
          console.warn("Aucun administrateur trouvé !");
          return;
        }
  
        const adminData = res.data[0]; // Récupération de la première ligne
  
        // Vérification si adminData est bien défini
        if (!adminData) {
          console.warn("adminData est undefined !");
          return;
        }
  
        setAdmin({
          prenom: adminData.prenom ?? "",
          nom: adminData.nom ?? "",
          date_naissance: adminData.date_naissance ? new Date(adminData.date_e).toISOString().split("T")[0] : "",
          sexe: adminData.sexe ?? "",
          profil: adminData.profil ?? null,
          identite: adminData.identite ?? null,
          situation: adminData.situation ?? "",
          telephone: adminData.telephone ?? "",
          mail: adminData.mail ?? "",
          diplome: adminData.diplome ?? "",
          niveau: adminData.niveau ?? "",
          code_admin: adminData.code_admin ?? 0,
          nombre_consultation: adminData.nombre_consultation ?? 0,
          salaire_brute: adminData.salaire_brute ?? 0,
          date_e: adminData.date_e ? new Date(adminData.date_e).toISOString().split("T")[0] : "",
          departement: adminData.departement ?? "",
          poste: adminData.poste ?? "",
          id_admin_clinique: adminData.id_admin_clinique ?? "",
        });
      })
      .catch((err) => console.error(" Erreur de récupération des données :", err));
  }, [idAdminClinique, token]);  

  // Gérer les modifications dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin({ ...admin, [name]: value || "" });
  };

  // Gérer les changements de fichiers
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      const file = files[0];
      setAdmin({ ...admin, [name]: file });
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id_admin", idAdminClinique);
    formData.append("nom", admin.nom);
    formData.append("prenom", admin.prenom);
    formData.append("date_naissance", admin.date_naissance);
    formData.append("sexe", admin.sexe);
    formData.append("profil", admin.profil); // Ajout du fichier profil
    formData.append("identite", admin.identite); // Ajout du fichier identite
    formData.append("situation", admin.situation);
    formData.append("telephone", admin.telephone);
    formData.append("mail", admin.mail);
    formData.append("diplome", admin.diplome);
    formData.append("niveau", admin.niveau);
    formData.append("code_admin", admin.code_admin);
    formData.append("nombre_consultation", admin.nombre_consultation);
    formData.append("salaire_brute", admin.salaire_brute);
    formData.append("date_e", admin.date_e);
    formData.append("departement", admin.departement);
    formData.append("poste", admin.poste);

    // Soumettre les données
    axios
      .put(`http://localhost:5001/update_admin/${idAdminClinique}`, formData, {
        headers: {
          Authorization: `Bearer ${token}` ,
          "Content-Type": "multipart/form-data", // Indiquer que c'est un formulaire avec des fichiers
        },
      })
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Données enregistrées avec succès dans la table administration.",
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
          <h2>Employé</h2>
          <div className="form-group">
            <label>Poste :</label>
            <input
              type="text"
              name="poste"
              value={admin.poste || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Prénom :</label>
            <input
              type="text"
              name="prenom"
              value={admin.prenom || ""}
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
              value={admin.nom || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Date de naissance :</label>
            <input
              type="date"
              name="date_naissance"
              value={admin.date_naissance || 0}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Sexe :</label>
            <input
              type="text"
              name="sexe"
              value={admin.sexe || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Situation :</label>
            <input
              type="text"
              name="situation"
              value={admin.situation || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Téléphone :</label>
            <input
              type="tel"
              name="telephone"
              value={admin.telephone || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Mail :</label>
            <input
              type="email"
              name="mail"
              value={admin.mail || ""}
              onChange={handleChange}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>diplome :</label>
            <input
              type="text"
              name="diplome"
              value={admin.diplome || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Niveau :</label>
            <input
              type="text"
              name="niveau"
              value={admin.niveau || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Nombre de consultations :</label>
            <input
              type="number"
              name="nombre_consultation"
              value={admin.nombre_consultation || 0}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Photo de profil :</label>
            {admin.profil && typeof admin.profil === "string" && (
              <img
                src={`http://localhost:5001/images/${admin.profil
                  .split("/")
                  .pop()}`}
                alt="Profil"
                style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              />
            )}
            <input type="file" name="profil" onChange={handleFileChange} />
          </div>
          <div className="form-group">
            <label>Photo d'identité' :</label>
            {admin.identite && typeof admin.identite === "string" && (
              <img
                src={`http://localhost:5001/images/${admin.identite
                  .split("/")
                  .pop()}`}
                alt="identite"
                style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              />
            )}
            <input type="file" name="identite" onChange={handleFileChange} />
          </div>
          <div className="form-group">
            <label>Salaire :</label>
            <input
              type="number"
              name="salaire_brute"
              value={admin.salaire_brute || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Date d'embauche :</label>
            <input
              type="date"
              name="date_e"
              value={admin.date_e || ""}
              onChange={handleChange}
              required
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Département :</label>
            <input
              type="text"
              name="departement"
              value={admin.departement || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Code :</label>
            <input
              type="password"
              name="code_admin"
              value={admin.code_admin || ""}
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

export default EditAdmin;
