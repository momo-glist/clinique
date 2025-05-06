import React, { useState, useEffect } from "react";
import "./Archive.scss";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../../../Components/Navbar/Navbar";
import Consult from "../../../Components/Consult/Consult";
import Linec from "../../../Components/line/Line";
import BarCharte from "../../../Components/bar/Bar";
import axios from "axios";

const ArchivAdmin = () => {
  const [consultations, setConsultations] = useState([]);
  const [filter, setFilter] = useState("jour"); // Filtrer par jour, mois, année
  const [metric, setMetric] = useState("consultation"); // Nombre de consultations ou montant total
  const [filteredData, setFilteredData] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5001/admin/arch", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Correction ici
      }) // Remplacez par l'endpoint correct
      .then((response) => {
        setConsultations(response.data); // Assurez-vous que la réponse contient les bonnes données
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des consultations :", error);
      });
  }, [token]);

  useEffect(() => {
    const filterData = () => {
      let filtered = [...consultations];

      if (filter === "mois") {
        filtered = filtered.map((consultation) => {
          const date = new Date(consultation.date);
          const month = date.toLocaleString("fr-FR", { month: "long" });
          const year = date.getFullYear();
          return { ...consultation, period: `${month} ${year}` };
        });
      } else if (filter === "annee") {
        filtered = filtered.map((consultation) => {
          const date = new Date(consultation.date);
          const year = date.getFullYear();
          return { ...consultation, period: year.toString() };
        });
      } else {
        filtered = filtered.map((consultation) => {
          const date = new Date(consultation.date);
          const day = date.toLocaleDateString("fr-FR");
          return { ...consultation, period: day };
        });
      }

      // Regroupement par période
      const groupedData = filtered.reduce((acc, consultation) => {
        const period = consultation.period;
        if (!acc[period]) {
          acc[period] = { name: period, count: 0, totalAmount: 0 };
        }
        acc[period].count += 1;
        acc[period].totalAmount += consultation.montant;
        return acc;
      }, {});

      // Transformer les données en tableau
      return Object.values(groupedData).map((entry) => ({
        ...entry,
        value: metric === "consultation" ? entry.count : entry.totalAmount,
      }));
    };

    setFilteredData(filterData());
  }, [consultations, filter, metric]);

  return (
    <div className="arch">
      <Sidebar />
      <Navbar />
      <div className="container">
        <div className="top">
          <div className="wrapper">
            <h2>Consultations</h2>
            <div>
              <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="jour">Jour</option>
                <option value="mois">Mois</option>
                <option value="annee">Année</option>
              </select>
              <select id="metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
                <option value="consultation">Nombre de consultations</option>
                <option value="montant">Montant total</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bottom">
          <div className="bottomCharts">
            <Linec data={filteredData} />
            <BarCharte data={filteredData} />
          </div>
          <Consult />
        </div>
      </div>
    </div>
  );
};

export default ArchivAdmin;

