import React, { useEffect, useState } from "react";
import Navbar from "../../../Components/Navbar/Navbar";
import "./Ventes.scss";
import Sidebar from "../Sidebar/Sidebar";
import ListVF from "../../../Components/Table/ListVF";
import Linec from "../../../Components/line/Line";
import BarCharte from "../../../Components/bar/Bar";
import axios from "axios";

const VenteB = () => {
  const [ventes, setVentes] = useState([]); // Données brutes des ventes
  const [filter, setFilter] = useState("jour"); // Filtrer par jour, mois, année
  const [metric, setMetric] = useState("ventes"); // Nombre de ventes ou montant total
  const [filteredData, setFilteredData] = useState([]); // Données filtrées pour les graphiques
  const token = localStorage.getItem("token");

  // Récupération des données depuis l'API
  useEffect(() => {
    axios
      .get("http://localhost:5001/ventes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }) // Remplacez par l'endpoint correct
      .then((response) => {
        setVentes(response.data); // Assurez-vous que la réponse contient les bonnes données
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des ventes :", error);
      });
  }, []);

  // Filtrage et transformation des données
  useEffect(() => {
    const filterData = () => {
      let filtered = [...ventes];
      console.log("Ventes :", ventes); // Log pour vérifier les données brutes

      // Ajout de la période (jour, mois ou année)
      if (filter === "mois") {
        filtered = filtered.map((vente) => {
          const date = new Date(vente.date);
          const month = date.toLocaleString("fr-FR", { month: "long" });
          const year = date.getFullYear();
          return { ...vente, period: `${month} ${year}` };
        });
      } else if (filter === "annee") {
        filtered = filtered.map((vente) => {
          const date = new Date(vente.date);
          const year = date.getFullYear();
          return { ...vente, period: year.toString() };
        });
      } else {
        filtered = filtered.map((vente) => {
          const date = new Date(vente.date);
          const day = date.toLocaleDateString("fr-FR");
          return { ...vente, period: day };
        });
      }

      // Regroupement par période
      const groupedData = filtered.reduce((acc, vente) => {
        const period = vente.period;
        if (!acc[period]) {
          acc[period] = { name: period, count: 0, totalAmount: 0 };
        }
        acc[period].count += 1; // Nombre de ventes
        acc[period].totalAmount += vente.montant_total || 0; // Montant total
        return acc;
      }, {});

      // Transformation en tableau et calcul des valeurs pour les graphiques
      return Object.values(groupedData).map((entry) => ({
        ...entry,
        value: metric === "ventes" ? entry.count : entry.totalAmount,
      }));
    };

    setFilteredData(filterData()); // Mise à jour des données filtrées
  }, [ventes, filter, metric]);

  return (
    <div className="echo">
      <Navbar />
      <div className="container">
        <Sidebar />
        <div className="content">
          <div className="top">
            <h1>Ventes</h1>
            <div>
              <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="jour">Jour</option>
                <option value="mois">Mois</option>
                <option value="annee">Année</option>
              </select>
              <select id="metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
                <option value="ventes">Nombre de ventes</option>
                <option value="montant">Montant total</option>
              </select>
            </div>
          </div>
          <div className="bottom">
            <div className="bottomCharts">
              <Linec data={filteredData} />
              <BarCharte data={filteredData} />
            </div>
            <ListVF />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenteB;

