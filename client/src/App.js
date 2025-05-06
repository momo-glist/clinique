import React from 'react';
import Auth from './pages/auth/Auth';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from './pages/admin/Admin.jsx';
import ArchivAdmin from './pages/admin/archives/Archiv.jsx';
import Dog from './pages/dog/Dog.jsx';
import ArchivDog from './pages/dog/archives/Archiv.jsx';
import View from './pages/view/View.jsx';
import Infirm from './pages/infirmiere/Infirm.jsx';
import Edit from "./pages/edit/Edit.jsx";
import Agenda from './pages/admin/agenda/Agenda.jsx';
import EditA from './pages/edit/Edita.jsx';
import AgendaDog from "./pages/dog/agenda/Agenda.jsx";
import Editi from './pages/edit/Editi.jsx';
import EditC from './pages/edit/EditC.jsx';
import ViewA from './pages/view/Viewa.jsx';
import Create from './pages/admin/Creation/Create.jsx';
import Admii from './pages/admin/Administration/Admii.jsx';
import Pharmacie from './pages/pharmacie/Pharmacie.jsx';
import Vente from './pages/pharmacie/Vente.jsx';
import Menu from './pages/admin/pharmacie/Menu.jsx';
import VenteA from './pages/admin/pharmacie/Vente.jsx';
import Soins from './pages/admin/Soins/Soins.jsx';
import Soin from './pages/admin/Soins/Soin.jsx';
import Ajou from './pages/pharmacie/ajout/Ajout.jsx';
import Historique from './pages/admin/pharmacie/Historique.jsx';
import Patient from './pages/infirmiere/patient/Patient.jsx';
import AgendaI from './pages/infirmiere/agenda/Agenda.jsx';
import ArchivI from './pages/infirmiere/archives/Archiv.jsx';
import Interne from './pages/interne/Interne.jsx';
import PatientG from './pages/interne/patient/Patient.jsx';
import AgendaIG from './pages/interne/agenda/Agenda.jsx';
import Charge from './pages/comptable/charges/Charges.jsx';
import AjouC from './pages/comptable/charges/AjoutC.jsx';
import Clini from './pages/comptable/clinic/Clini.jsx';
import Achat from './pages/comptable/pharmacie/Achat.jsx';
import Ventes from './pages/comptable/pharmacie/Vente.jsx';
import MenuSal from './pages/comptable/salaire/MenuSal.jsx';
import EditS from './pages/edit/EditS.jsx';
import PaiementSalarie from './pages/comptable/salaire/paiement.jsx';
import AjouterAvanceSalaire from './pages/comptable/salaire/Avance.jsx';
import EditAdmin from './pages/edit/EditAdmin.jsx';
import ViewC from './pages/view/ViewC.jsx';
import Labo from './pages/labo/Labo.jsx';
import EditLab from './pages/edit/editLabo.jsx';
import LaboArch from './pages/labo/archive/LaboArch.jsx';
import VenteB from './pages/pharmacie/pharmacie/Vente.jsx';
import HistoriqueP from './pages/pharmacie/pharmacie/Historique.jsx';
import AdmiiP from './pages/pharmacie/Administration/Admii.jsx';
import CreateP from './pages/pharmacie/Creation/Create.jsx';
import LaboAdmin from './pages/admin/labo/LaboArch.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/infirm" element={<Infirm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/arch" element={<ArchivAdmin />} />
        <Route path="/admin/create" element={<Create />} />
        <Route path="/pharmacie/create" element={<CreateP />} />
        <Route path="/admin/administration" element={<Admii />} />
        <Route path="/pharmacie/administration" element={<AdmiiP />} />
        <Route path="/dog" element={<Dog />} />
        <Route path="/dog/arch" element={<ArchivDog />} />
        <Route path="/view/:id" element={<View />} />
        <Route path="/viewc/:id" element={<ViewC />} />
        <Route path="/viewa/:id" element={<ViewA />} />
        <Route path="/edit/:id" element={<Edit/>} />
        <Route path="/edita/:id" element={<EditA/>} />
        <Route path="/editi/:id" element={<Editi/>} />
        <Route path="/editc/:id" element={<EditC/>} />
        <Route path="/admin/agenda" element={<Agenda/>} />
        <Route path="/dog/agenda" element={<AgendaDog/>} />
        <Route path="/pharmacie" element={<Pharmacie/>} />
        <Route path="/pharmacie/vente" element={<Vente/>} />
        <Route path="/admin/menu" element={<Menu/>} />
        <Route path="/admin/vente" element={<VenteA/>} />
        <Route path="/pharmacie/ventes" element={<VenteB/>} />
        <Route path="/admin/soins" element={<Soins/>} />
        <Route path="/admin/soin" element={<Soin/>} />
        <Route path="/pharmacie/ajout" element={<Ajou/>} />
        <Route path="/admin/historique" element={<Historique/>} />
        <Route path="/pharmacie/historique" element={<HistoriqueP/>} />
        <Route path="/infirm/patient" element={<Patient/>} />
        <Route path="/infirm/agenda" element={<AgendaI/>} />
        <Route path="/infirm/arch" element={<ArchivI/>} />
        <Route path="/interne" element={<Interne/>} />
        <Route path="/interne/patient" element={<PatientG/>} />
        <Route path="/interne/agenda" element={<AgendaIG/>} />
        <Route path="/comptable" element={<Charge/>} />
        <Route path="/comptable/ajout" element={<AjouC/>} />
        <Route path="/comptable/consultation" element={<Clini/>} />
        <Route path="/comptable/achat" element={<Achat/>} />
        <Route path="/comptable/vente" element={<Ventes/>} />
        <Route path="/comptable/salarier" element={<MenuSal/>} />
        <Route path="/edits/:id" element={<EditS/>} />
        <Route path="/comptable/salaire" element={<PaiementSalarie/>} />
        <Route path="/comptable/avance" element={<AjouterAvanceSalaire/>} />
        <Route path="/editadmin/:idAdminClinique" element={<EditAdmin/>} />
        <Route path="/labo" element={<Labo/>} />
        <Route path="/labo/arch" element={<LaboArch/>} />
        <Route path="/admin/labo" element={<LaboAdmin/>} />
        <Route path="/editlab/:id" element={<EditLab/>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;



