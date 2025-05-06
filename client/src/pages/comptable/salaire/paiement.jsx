import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./Paiement.scss";
import Swal from "sweetalert2";

const PaiementSalarie = () => {
  const [employes, setEmployes] = useState([]);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [salaireBrute, setSalaireBrute] = useState(0);
  const [amo, setAmo] = useState(0);
  const [inps, setInps] = useState(0);
  const [surSalaire, setSurSalaire] = useState(""); // Initialisé à une chaîne vide
  const [prime, setPrime] = useState(""); // Initialisé à une chaîne vide
  const [montantAvance, setMontantAvance] = useState(0); // Avance
  const [its, setIts] = useState(""); // Initialisé à une chaîne vide
  const [net, setNet] = useState(0);
  const [telephone, setTelephone] = useState(""); // Nouveau champ
  const [mail, setMail] = useState(""); // Nouveau champ
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  

  useEffect(() => {
    setLoading(true);

    axios
      .get("http://localhost:5001/employes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setEmployes(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des employés:", error);
        setLoading(false);
      });
  }, [token]);

  // Lorsqu'un employé est sélectionné
  const handleEmployeChange = (event) => {
    const employeId = event.target.value;
    setSelectedEmploye(employeId);

    // Récupérer toutes les données nécessaires en parallèle
    Promise.all([
      axios.get(`http://localhost:5001/employe/${employeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      axios.get(`http://localhost:5001/salaire/${employeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      axios.get(`http://localhost:5001/avance_salaire/${employeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ])
      .then(([employeResponse, salaireResponse, avanceResponse]) => {
        const { telephone, mail } = employeResponse.data; // Récupérer téléphone et mail
        setTelephone(telephone);
        setMail(mail);

        const { salaire_brute, amo, inps } = salaireResponse.data;
        setSalaireBrute(salaire_brute);
        setAmo(amo);
        setInps(inps);

        const { avance } = avanceResponse.data;
        setMontantAvance(avance || 0);

        // Calculer le salaire net
        calculateNet(salaire_brute, amo, inps);
      })
      .catch((error) => {
        console.error(
          "Erreur lors de la récupération des informations:",
          error
        );
      });
  };

  // Calcul du salaire net
  const calculateNet = useCallback((salaireBrute, amo, inps) => {
    const netSalary =
      salaireBrute +
      (Number(surSalaire) || 0) +
      (Number(prime) || 0) -
      inps -
      amo -
      (Number(montantAvance) || 0) -
      (Number(its) || 0);
    setNet(netSalary);
  }, [surSalaire, prime, montantAvance, its]);

  useEffect(() => {
    if (salaireBrute > 0 && amo >= 0 && inps >= 0) {
      calculateNet(salaireBrute, amo, inps);
    }
  }, [salaireBrute, amo, inps, calculateNet]);

  // Fonction de soumission du formulaire
  const handleSubmit = () => {
    const paiementData = {
      id_admin_clinique: selectedEmploye,
      salaire_brute: salaireBrute,
      sur_salaire: Number(surSalaire) || 0,
      prime: Number(prime) || 0,
      avance: montantAvance,
      its: Number(its) || 0,
      net,
    };

    setLoading(true); // Affichage du chargement pendant le paiement

    axios
      .post("http://localhost:5001/paiement", paiementData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        // Vérifier si un paiement a déjà été effectué
        if (response.data.message.includes("Un paiement a déjà été effectué")) {
          Swal.fire({
            icon: "info",
            title: "Information",
            text: response.data.message,
            confirmButtonText: "OK",
          });
      
          // Réinitialiser les états après la soumission
          resetForm();
        } else {
          // Paiement effectué avec succès
          Swal.fire({
            icon: "success",
            title: "Succès",
            text: "Paiement effectué avec succès",
            confirmButtonText: "OK",
          });
      
          // Réinitialiser les états après la soumission
          resetForm();
        }
      })
      .catch((error) => {
        if (error.response) {
          // Gérer les erreurs de serveur
          Swal.fire({
            icon: "error",
            title: "Erreur",
            text: "Erreur lors du paiement",
            confirmButtonText: "OK",
          });
        }
        console.error(error);
      })      
      .finally(() => {
        setLoading(false); // Cacher le chargement après la soumission
      });
  };

  // Fonction pour réinitialiser tous les champs
  const resetForm = () => {
    setSelectedEmploye(null);
    setSalaireBrute(0);
    setAmo(0);
    setInps(0);
    setSurSalaire("");
    setPrime("");
    setMontantAvance(0);
    setIts("");
    setNet(0);
    setTelephone("");
    setMail("");
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
        <div className="paiement-salarie-container">
          <h1>SALAIRE</h1>

          {loading ? (
            <div>Chargement...</div>
          ) : (
            <select
              id="employe"
              onChange={handleEmployeChange}
              value={selectedEmploye || ""}
            >
              <option value="">Sélectionner un employé</option>
              {employes.map((employe) => (
                <option key={employe.id_admin_clinique} value={employe.id_admin_clinique}>
                  {employe.nom} {employe.prenom}
                </option>
              ))}
            </select>
          )}

          {selectedEmploye && (
            <>
              <div className="salary-info">
                <p>
                  <strong>Salaire Brut:</strong> {salaireBrute} FCFA
                </p>
                <p>
                  <strong>AMO:</strong> {amo} FCFA
                </p>
                <p>
                  <strong>INPS:</strong> {inps} FCFA
                </p>
                <p>
                  <strong>Avance:</strong> {montantAvance} FCFA
                </p>
                <p>
                  <strong>Téléphone:</strong> {telephone}
                </p>
                <p>
                  <strong>Email:</strong> {mail}
                </p>
              </div>

              <div className="input-group">
                <label>
                  Sur-salaire:
                  <input
                    type="number"
                    value={surSalaire}
                    onChange={(e) => setSurSalaire(e.target.value)}
                  />
                </label>
              </div>

              <div className="input-group">
                <label>
                  Prime:
                  <input
                    type="number"
                    value={prime}
                    onChange={(e) => setPrime(e.target.value)}
                  />
                </label>
              </div>

              <div className="input-group">
                <label>
                  ITS:
                  <input
                    type="number"
                    value={its}
                    onChange={(e) => setIts(e.target.value)}
                  />
                </label>
              </div>

              <div>
                <p>
                  <strong>Salaire Net:</strong> {net} FCFA
                </p>
              </div>

              <button className="submit-button" onClick={handleSubmit}>
                Valider le paiement
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaiementSalarie;
