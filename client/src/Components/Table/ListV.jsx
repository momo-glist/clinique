import React, { useState, useEffect, useCallback } from "react";
import "./ListV.scss";
import axios from "axios";
import Swal from "sweetalert2";

const ListV = () => {
  const [lines, setLines] = useState([
    {
      id_medicament: null,
      nom: "",
      forme: "",
      dosage: "",
      quantite_vendue: "",
      prix_unitaire: "",
    },
  ]);
  const [montantTotal, setMontantTotal] = useState(0);
  const [modePaiement, setModePaiement] = useState("");
  const [suggestions, setSuggestions] = useState({
    noms: [],
    formes: [],
    dosages: [],
  });
  const [token] = useState(localStorage.getItem("token"));

  const fetchSuggestions = useCallback(
    (type, query) => {
      const endpoints = {
        nom: "http://localhost:5001/medicaments/search",
        forme: "http://localhost:5001/formes/search",
        dosage: "http://localhost:5001/dosages/search",
      };
      console.log("Fetching suggestions for:", type, "with query:", query);
      console.log("Endpoint URL:", endpoints[type]);
  
      axios
        .get(endpoints[type], {
          params: { name: query },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          console.log("Réponse reçue:", res.data);
          setSuggestions((prev) => ({
            ...prev,
            [type + "s"]: res.data.map((item) => item[type]),
          }));
        })
        .catch((err) => {
          console.error(`Erreur lors de la récupération des ${type}s:`, err.response || err);
        });
    },
    [token] // les dépendances nécessaires
  );

  useEffect(() => {
    fetchSuggestions("nom", "");
    fetchSuggestions("forme", "");
    fetchSuggestions("dosage", "");
  }, [token, fetchSuggestions]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id_medicament: null,
        nom: "",
        forme: "",
        dosage: "",
        quantite_vendue: "",
        prix_unitaire: "",
      },
    ]);
  };

  const [loading, setLoading] = useState(false);

  const fetchMedicamentId = (nom, forme, dosage, index) => {
    if (nom && forme && dosage) {
      axios
        .get("http://localhost:5001/medicaments", {
          params: { nom, forme, dosage },
          headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
        })
        .then((res) => {
          const medicament = res.data[0]; // On suppose que l'API renvoie une liste et on prend le premier résultat
          if (medicament) {
            const { id_medicament, prix_unitaire, stock_courant } = medicament;
            const updatedLines = [...lines];
            updatedLines[index] = {
              ...updatedLines[index],
              id_medicament,
              prix_unitaire: prix_unitaire || 0,
              stock_courant: stock_courant || 0,
            };
            setLines(updatedLines);
            calculateMontantTotal(updatedLines);
          }
        })
        .catch((err) => {
          console.error("❌ Erreur lors de la récupération du médicament :", err);
        });
    }
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const updatedLines = [...lines];
    updatedLines[index][name] = value;

    // Réinitialiser les valeurs liées si l'un des champs critiques change
    if (["nom", "forme", "dosage"].includes(name)) {
      updatedLines[index].id_medicament = null;
      updatedLines[index].prix_unitaire = "";
      updatedLines[index].stock_courant = 0;
      updatedLines[index].quantite_vendue = ""; // Réinitialiser la quantité vendue
    }

    setLines(updatedLines);

    // Vérification et calcul des quantités si la quantité vendue change
    if (name === "quantite_vendue") {
      const quantiteVendu = parseFloat(value) || 0;
      const quantiteDisponible = updatedLines[index].stock_courant || 0;
      updatedLines[index].quantiteValide = quantiteVendu <= quantiteDisponible;
      calculateMontantTotal(updatedLines);
    } else {
      // Mettre à jour les suggestions et récupérer l'ID du médicament si tous les champs sont remplis
      fetchSuggestions(name, value);
      if (
        ["nom", "forme", "dosage"].every((field) => updatedLines[index][field])
      ) {
        fetchMedicamentId(
          updatedLines[index].nom,
          updatedLines[index].forme,
          updatedLines[index].dosage,
          index
        );
      }
    }
  };

  const calculateMontantTotal = (updatedLines) => {
    const total = updatedLines.reduce((acc, line) => {
      const quantite = parseFloat(line.quantite_vendue) || 0;
      const prix = parseFloat(line.prix_unitaire) || 0;
      return acc + quantite * prix;
    }, 0);
    setMontantTotal(total);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!modePaiement) {
      return Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Le mode de paiement est requis.",
        confirmButtonText: "OK",
      });
    }

    const code_admin = prompt("Veuillez entrer votre code :");
    if (!code_admin) {
      return Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Le code est requis.",
        confirmButtonText: "OK",
      });
    }

    const validLines = lines.map((line) => ({
      id_medicament: line.id_medicament,
      quantite_vendue: isNaN(parseInt(line.quantite_vendue))
        ? 0
        : parseInt(line.quantite_vendue),
      prix_unitaire: isNaN(parseFloat(line.prix_unitaire))
        ? 0
        : parseFloat(line.prix_unitaire),
      nom: line.nom,
      forme: line.forme,
      dosage: line.dosage,
    }));

    const isValid = validLines.every((line) => {
      const valid =
        line.id_medicament &&
        line.quantite_vendue > 0 &&
        line.nom &&
        line.forme &&
        line.dosage;

      if (!valid) {
        console.log("Ligne invalide:", line);
      }

      return valid;
    });

    if (!isValid) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Veuillez vérifier les informations. Certaines informations sont manquantes.",
        confirmButtonText: "OK",
      });
      return;
    }

    const data = {
      code_admin: code_admin,
      mode_paiement: modePaiement,
      medicaments: validLines,
    };

    setLoading(true);

    axios
      .post("http://localhost:5001/effectuer-vente", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Réponse de la vente:", res.data); // Vérifiez ici
        Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Vente effectuée avec succès !",
          confirmButtonText: "OK",
        });

        setLines([
          {
            nom: "",
            forme: "",
            dosage: "",
            quantite_vendue: "",
            prix_unitaire: "",
          },
        ]);
        setMontantTotal(0);
        setModePaiement("");
      })
      .catch((err) => {
        console.error(
          "Erreur lors de la vente :",
          err.response?.data || err.message
        );

        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Erreur lors de la vente !",
          confirmButtonText: "OK",
        });
      })
      .finally(() => {
        setLoading(false); // Arrête le spinner
      });
  };

  const handleModePaiementChange = (e) => {
    setModePaiement(e.target.value);
  };

  return (
    <div className="list-v">
      {loading && (
        <div className="modal">
          <div className="spinner"></div> {/* Animation du spinner */}
          <p>Loading...</p>
        </div>
      )}
      {lines.map((line, index) => (
        <div key={index} className="line">
          <input
            type="text"
            name="nom"
            value={line.nom}
            placeholder="Nom du médicament"
            onChange={(e) => handleInputChange(e, index)}
            list="noms"
          />
          <datalist id="noms">
            {suggestions.noms.map((nom, i) => (
              <option key={i} value={nom} />
            ))}
          </datalist>
          <input
            type="text"
            name="forme"
            value={line.forme}
            placeholder="Forme"
            onChange={(e) => handleInputChange(e, index)}
            list="formes"
          />
          <datalist id="formes">
            {suggestions.formes.map((forme, i) => (
              <option key={i} value={forme} />
            ))}
          </datalist>
          <input
            type="text"
            name="dosage"
            value={line.dosage}
            placeholder="Dosage"
            onChange={(e) => handleInputChange(e, index)}
            list="dosages"
          />
          <datalist id="dosages">
            {suggestions.dosages.map((dosage, i) => (
              <option key={i} value={dosage} />
            ))}
          </datalist>
          <input
            type="number"
            name="quantite_vendue"
            value={line.quantite_vendue}
            placeholder="Quantité vendue"
            onChange={(e) => handleInputChange(e, index)}
            style={{
              borderColor: line.quantiteValide === false ? "red" : "initial", // Si la quantité est invalide, bordure rouge
              outlineColor: line.quantiteValide === false ? "red" : "initial", // Optionnel : affecte également le contour du champ
              boxShadow: line.quantiteValide === false ? "0 0 5px red" : "none", // Ajouter un effet de "shadow" rouge en cas d'erreur
            }}
          />
          <input
            type="number"
            name="prix_unitaire"
            value={line.prix_unitaire}
            placeholder="Prix Unitaire"
            readOnly
          />
        </div>
      ))}
      <div className="total-container">
        <div className="montant-total">
          <strong>Montant Total :</strong>
          <span>{montantTotal.toFixed(2)} FCFA</span>
        </div>
        <div className="mode-paiement">
          <label htmlFor="mode-paiement">Mode de paiement:</label>
          <select
            name="mode-paiement"
            id="mode-paiement"
            onChange={handleModePaiementChange}
            value={modePaiement}
          >
            <option value="">-- Sélectionnez un mode --</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte bancaire</option>
            <option value="orange">Orange Money</option>
            <option value="malitel">Moov Money</option>
            <option value="espom">Espèces et Orange Money</option>
            <option value="espmm">Espèces et Moov Money</option>
            <option value="espc">Espèces et Carte bancaire</option>
          </select>
        </div>
      </div>
      <div className="buttons">
        <button onClick={addLine}>Ajouter une ligne</button>
        <button onClick={handleSubmit}>Effectuer la vente</button>
      </div>
    </div>
  );
};

export default ListV;
