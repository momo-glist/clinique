import React, { useState } from 'react';
import axios from 'axios';
import "./ListA.scss"
import Swal from 'sweetalert2';

const ListA = () => {
  // État pour les champs du formulaire
  const [medicament, setMedicament] = useState({
    nom: '',
    forme: '',
    dosage: '',
    posologie: '',
    stock_courant: '',
    prix_achat: '',
    prix_vente: '',
    date_achat: '',
    date_peremption: '',
    fournisseur: '',
    num_fournisseur: '',
  });

  // Gérer les changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicament({
      ...medicament,
      [name]: value,
    });
  };

  // Gérer l'envoi du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/add-medicament', medicament);
      // Affichage d'un message de succès avec SweetAlert2
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: response.data,
        confirmButtonText: 'OK',
      });
  
      // Réinitialiser l'état des champs après soumission réussie
      setMedicament({
        nom: '',
        forme: '',
        dosage: '',
        posologie: '',
        stock_courant: '',
        prix_achat: '',
        prix_vente: '',
        date_achat: '',
        date_peremption: '',
        fournisseur: '',
        num_fournisseur: '',
      });
  
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament', error);

       // Affichage d'un message d'erreur avec SweetAlert2
       Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur s\'est produite lors de l\'ajout du médicament. Veuillez réessayer.',
        confirmButtonText: 'OK',
      });
    }
  };
  

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="medicament-form">
        <div className="form-group">
          <label>Nom du médicament</label>
          <input
            type="text"
            name="nom"
            value={medicament.nom}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Forme</label>
          <input
            type="text"
            name="forme"
            value={medicament.forme}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Dosage</label>
          <input
            type="text"
            name="dosage"
            value={medicament.dosage}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Posologie</label>
          <input
            type="text"
            name="posologie"
            value={medicament.posologie}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Stock courant</label>
          <input
            type="number"
            name="stock_courant"
            value={medicament.stock_courant}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Prix d'achat</label>
          <input
            type="number"
            name="prix_achat"
            value={medicament.prix_achat}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Prix de vente</label>
          <input
            type="number"
            name="prix_vente"
            value={medicament.prix_vente}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Date d'achat</label>
          <input
            type="date"
            name="date_achat"
            value={medicament.date_achat}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Date de péremption</label>
          <input
            type="date"
            name="date_peremption"
            value={medicament.date_peremption}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Fournisseur</label>
          <input
            type="text"
            name="fournisseur"
            value={medicament.fournisseur}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Numéro du fournisseur</label>
          <input
            type="text"
            name="num_fournisseur"
            value={medicament.num_fournisseur}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-btn">Ajouter le médicament</button>
      </form>
    </div>
  );
};

export default ListA;
