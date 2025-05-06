const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const fs = require("fs");
const os = require("os");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const puppeteer = require("puppeteer");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Obtient le chemin du dossier "Téléchargements" en fonction du système d'exploitation
let downloadsPath = null;

try {
  downloadsPath = path.join(os.homedir(), "Downloads");

  if (!fs.existsSync(downloadsPath)) {
    console.warn("Le dossier 'Téléchargements' n'existe pas à l'emplacement :", downloadsPath);
  }
} catch (error) {
  console.error("Erreur lors de la récupération du dossier 'Téléchargements' :", error.message);
}

function getBase64Image(filePath) {
  try {
    const file = fs.readFileSync(filePath);
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch (err) {
    console.error("Erreur lors de la lecture de l'image pour encodage Base64 :", err.message);
    return null;
  }
}

let logoBase64 = null;

try {
  let logoPath = path.resolve(__dirname, "img", "health.png");
  if (fs.existsSync(logoPath)) {
    logoBase64 = getBase64Image(logoPath);
  } else {
    console.warn("Le fichier health.png n'existe pas à l'emplacement attendu :", logoPath);
  }
} catch (error) {
  console.error("Erreur lors de la lecture ou de la conversion du logo :", error.message);
}

app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "http://localhost:4000", // Autoriser le frontend React
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const port = process.env.PORT || 5000

// Connexion à la base de données MySQL (MAMP)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'myuserpassword',
  database: process.env.DB_NAME || 'sante',
});


// Vérification de la connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    return;
  }
  console.log("Connecté à la base de données MySQL");
});

// Créer le chemin vers le dossier 'img' dans 'server'
const imgDir = path.join(__dirname, "server", "img");
app.use("/images", express.static(imgDir));

// Vérifier si le dossier 'img' existe, sinon le créer
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Configuration de multer pour stocker les fichiers dans le dossier 'img'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgDir); // Utiliser le dossier 'img'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier
  },
});

const upload = multer({ storage });
const PDFDocument = require("pdfkit"); // Si vous souhaitez utiliser PDFKit en complément

{
  /* DEBUT ADMINISTRATION*/
}

// Route pour gérer l'insertion des données et téléversement des images
app.get("/", (req, res) => {
  res.send("Bienvenue sur le serveur backend");
});

// Middleware pour vérifier et extraire le token
const verifyToken = (req, res, next) => {
  console.log("🔍 Headers reçus :", req.headers); // Voir ce qui est reçu

  const token = req.headers.authorization?.split(" ")[1]; // Extraction du token

  if (!token) {
    console.error("⛔ Aucun token fourni !");
    return res.status(403).json({ message: "Aucun token fourni" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("⛔ Token invalide ou expiré !");
      return res.status(403).json({ message: "Token invalide ou expiré" });
    }
    console.log("✅ Token décrypté :", decoded);
    req.user = decoded;
    next();
  });
};

// Ajouter ce middleware à votre route pour administrer la création des employés
app.post(
  "/administration",
  verifyToken, // Vérifier le token
  upload.fields([{ name: "profil" }, { name: "identite" }]),
  (req, res) => {
    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      situation,
      telephone,
      mail,
      departement,
      poste,
      code_admin,
      diplome,
      niveau,
      date_e,
      salaire, // Salaire brut
    } = req.body;

    const profil = req.files.profil ? req.files.profil[0] : null;
    const identite = req.files.identite ? req.files.identite[0] : null;

    // Récupérer id_clinique depuis le token
    const { idClinique } = req.user; // Utilisation de idClinique extrait du token

    if (!idClinique) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Trouver le prochain id_admin_clinique
    const getLastAdminCliniqueQuery = `
      SELECT MAX(id_admin_clinique) AS last_admin_id
      FROM administration
      WHERE id_clinique = ?`;

    db.query(getLastAdminCliniqueQuery, [idClinique], (err, result) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération du dernier ID admin clinique:",
          err
        );
        return res.status(500).json({
          message:
            "Erreur serveur lors de la récupération du dernier ID admin clinique",
          error: err,
        });
      }

      // Déterminer le prochain id_admin_clinique
      const newAdminCliniqueId = (result[0].last_admin_id || 0) + 1;

      // Vérifier si le telephone existe deja
      const checkPhone = `SELECT COUNT(*) AS count FROM administration WHERE telephone = ? AND id_clinique = ?`;

      db.query(checkPhone, [telephone, idClinique], (err, phoneResults) => {
        if (err) {
          console.error("Erreur lors de la vérification du téléphone:", err);
          return res.status(500).json({
            message: "Erreur serveur lors de la vérification du téléphone",
            error: err,
          });
        }

        if (phoneResults[0].count > 0) {
          return res.status(400).json({
            message: "Ce numéro de téléphone existe déjà.",
          });
        }

        // Vérifier si le salaire brut existe déjà dans la table salaire
        const checkSalaireQuery = `SELECT id_salaire FROM salaire WHERE salaire_brute = ? AND id_clinique = ?`;

        db.query(
          checkSalaireQuery,
          [salaire, idClinique],
          (err, salaireResults) => {
            if (err) {
              console.error("Erreur lors de la vérification du salaire:", err);
              return res.status(500).json({
                message: "Erreur serveur lors de la vérification du salaire",
                error: err,
              });
            }

            let idSalaire;
            if (salaireResults.length === 0) {
              // Calculer INPS et AMO
              const inps = salaire * 0.036; // 3.6% de salaire_brute
              const amo = salaire * 0.0306; // 3.06% de salaire_brute

              // Insérer le nouveau salaire
              const salaireQuery = `INSERT INTO salaire (salaire_brute, inps, amo, id_clinique) VALUES (?, ?, ?, ?)`;

              db.query(
                salaireQuery,
                [salaire, inps, amo, idClinique],
                (err, salaireInsertResults) => {
                  if (err) {
                    console.error(
                      "Erreur lors de l'insertion du salaire:",
                      err
                    );
                    return res.status(500).json({
                      message: "Erreur serveur lors de l'insertion du salaire",
                      error: err,
                    });
                  }
                  idSalaire = salaireInsertResults.insertId;

                  // Hacher le code_admin avant d'insérer l'employé
                  bcrypt.hash(code_admin, 10, (err, hashedPassword) => {
                    if (err) {
                      console.error(
                        "Erreur lors du hachage du mot de passe:",
                        err
                      );
                      return res.status(500).json({
                        message:
                          "Erreur serveur lors du hachage du mot de passe",
                        error: err,
                      });
                    }
                    insertEmploye(
                      idSalaire,
                      departement,
                      poste,
                      niveau,
                      nom,
                      prenom,
                      date_naissance,
                      sexe,
                      situation,
                      telephone,
                      mail,
                      hashedPassword, // Utiliser le mot de passe haché
                      diplome,
                      date_e,
                      profil,
                      identite,
                      idClinique, // Passer id_clinique
                      newAdminCliniqueId, // Passer le nouvel id_admin_clinique
                      res
                    );
                  });
                }
              );
            } else {
              // Utiliser l'ID du salaire existant
              idSalaire = salaireResults[0].id_salaire;

              // Hacher le code_admin avant d'insérer l'employé
              bcrypt.hash(code_admin, 10, (err, hashedPassword) => {
                if (err) {
                  console.error("Erreur lors du hachage du mot de passe:", err);
                  return res.status(500).json({
                    message: "Erreur serveur lors du hachage du mot de passe",
                    error: err,
                  });
                }
                insertEmploye(
                  idSalaire,
                  departement,
                  poste,
                  niveau,
                  nom,
                  prenom,
                  date_naissance,
                  sexe,
                  situation,
                  telephone,
                  mail,
                  hashedPassword, // Utiliser le mot de passe haché
                  diplome,
                  date_e,
                  profil,
                  identite,
                  idClinique, // Passer id_clinique
                  newAdminCliniqueId, // Passer le nouvel id_admin_clinique
                  res
                );
              });
            }
          }
        );
      });
    });
  }
);

// Fonction pour insérer l'employé dans la table administration
function insertEmploye(
  idSalaire,
  departement,
  poste,
  niveau,
  nom,
  prenom,
  date_naissance,
  sexe,
  situation,
  telephone,
  mail,
  hashedPassword,
  diplome,
  date_e,
  profil,
  identite,
  idClinique,
  idAdminClinique, // Nouveau paramètre
  res
) {
  const departementQuery = `SELECT id_departement FROM departements WHERE departement = ? AND id_clinique = ?`;

  db.query(
    departementQuery,
    [departement, idClinique],
    (err, departementResults) => {
      if (err) {
        console.error("Erreur lors de la vérification du département:", err);
        return res.status(500).json({
          message: "Erreur serveur lors de la vérification du département",
          error: err,
        });
      }

      let idDepartement;
      if (departementResults.length === 0) {
        // Si le département n'existe pas, on l'ajoute
        const insertDepartementQuery = `INSERT INTO departements (departement, poste, id_clinique) VALUES (?, ?, ?)`;

        db.query(
          insertDepartementQuery,
          [departement, poste, idClinique],
          (err, insertDepartementResults) => {
            if (err) {
              console.error("Erreur lors de l'insertion du département:", err);
              return res.status(500).json({
                message: "Erreur serveur lors de l'insertion du département",
                error: err,
              });
            }

            idDepartement = insertDepartementResults.insertId;

            // Étape 3 : Insérer l'employé dans la table administration
            const query = `
           INSERT INTO administration (
             nom, prenom, date_naissance, sexe, situation, telephone, mail,
             id_departement, code_admin, diplome, niveau, date_e, id_salaire, profil, identite, id_clinique, id_admin_clinique
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         `;

            db.query(
              query,
              [
                nom,
                prenom,
                date_naissance,
                sexe,
                situation,
                telephone,
                mail,
                idDepartement, // Utiliser id_departement comme clé étrangère
                hashedPassword,
                diplome,
                niveau,
                date_e,
                idSalaire, // Utiliser id_salaire comme clé étrangère
                profil ? profil.path : null, // Assurez-vous que le chemin du fichier est correct
                identite ? identite.path : null, // Idem pour le fichier identite
                idClinique,
                idAdminClinique,
              ],
              (err, results) => {
                if (err) {
                  console.error(
                    "Erreur lors de l'insertion de l'employé:",
                    err
                  );
                  return res.status(500).json({
                    message: "Erreur serveur lors de l'insertion de l'employé",
                    error: err,
                  });
                }
                res.status(200).json({
                  message: `${departement} ajouté avec succès !`,
                });
              }
            );
          }
        );
      } else {
        // Si le département existe déjà, on utilise son id
        idDepartement = departementResults[0].id_departement;

        // Étape 3 : Insérer l'employé dans la table administration
        const query = `
         INSERT INTO administration (
           nom, prenom, date_naissance, sexe, situation, telephone, mail, 
           id_departement, code_admin, diplome, niveau, date_e, id_salaire, profil, identite, id_clinique, id_admin_clinique
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `;

        db.query(
          query,
          [
            nom,
            prenom,
            date_naissance,
            sexe,
            situation,
            telephone,
            mail,
            idDepartement, // Utiliser id_departement comme clé étrangère
            hashedPassword,
            diplome,
            niveau,
            date_e,
            idSalaire, // Utiliser id_salaire comme clé étrangère
            profil ? profil.path : null, // Assurez-vous que le chemin du fichier est correct
            identite ? identite.path : null, // Idem pour le fichier identite
            idClinique,
            idAdminClinique,
          ],
          (err, results) => {
            if (err) {
              console.error("Erreur lors de l'insertion de l'employé:", err);
              return res.status(500).json({
                message: "Erreur serveur lors de l'insertion de l'employé",
                error: err,
              });
            }
            res.status(200).json({
              message: `${departement} ajouté avec succès !`,
            });
          }
        );
      }
    }
  );
}

// Votre route existante pour obtenir les données
app.get("/administration/:idAdminClinique", verifyToken, (req, res) => {
  console.log("✅ ID de la clinique extrait du token :", req.user.idClinique);

  const { idAdminClinique } = req.params;
  const idClinique = req.user.idClinique; // Vérification si cette valeur est bien extraite

  if (!idClinique) {
    return res
      .status(403)
      .json({ message: "Accès refusé : ID Clinique manquant dans le token" });
  }

  const query = `
    SELECT 
      a.id_admin_clinique, a.nom, a.prenom, a.date_naissance, a.sexe, a.date_e, a.telephone, a.mail, a.situation, 
      d.departement, d.poste, a.nombre_consultation, a.profil, a.identite, a.diplome, a.niveau, 
      s.salaire_brute 
    FROM administration a
    LEFT JOIN salaire s ON a.id_salaire = s.id_salaire
    LEFT JOIN departements d ON a.id_departement = d.id_departement
    WHERE a.id_clinique = ? AND a.id_admin_clinique <> 1 ;
  `;

  db.query(query, [idClinique, idAdminClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des données:", err);
      return res.status(500).json({ message: "Erreur serveur", error: err });
    }
    res.status(200).json(results);
  });
});

// Route d'authentification
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Clé secrète pour signer les JWT
const SECRET_KEY = "votre_cle_secrete";

// Endpoint d'authentification
app.post("/auth", (req, res) => {
  const { telephone, code_admin } = req.body;

  if (!telephone || typeof telephone !== "string" || telephone.trim() === "") {
    logger.error("Numéro de téléphone manquant ou invalide");
    return res.status(400).json({ error: "Numéro de téléphone requis" });
  }

  if (
    !code_admin ||
    typeof code_admin !== "string" ||
    code_admin.trim() === ""
  ) {
    logger.error("Code administrateur manquant ou invalide");
    return res.status(400).json({ error: "Code administrateur requis" });
  }

  logger.info(`Tentative de connexion pour : ${telephone}`);

  // Requête pour récupérer l'utilisateur via son numéro de téléphone et l'information sur la clinique (statut)
  const query = `
    SELECT a.id_admin_clinique, a.id_clinique, a.code_admin, a.telephone, a.id_departement, d.poste, c.statut
    FROM administration a 
    LEFT JOIN departements d ON a.id_departement = d.id_departement
    LEFT JOIN cliniques c ON a.id_clinique = c.id_clinique
    WHERE a.telephone = ? 
  `;

  db.query(query, [telephone], (err, results) => {
    if (err) {
      logger.error("Erreur lors de la requête SQL", { error: err });
      logger.info(
        `Paramètres reçus: telephone = ${telephone}, code_admin = ${code_admin}`
      );
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }

    if (!Array.isArray(results) || results.length === 0) {
      logger.warn("Aucun employé trouvé avec ce numéro de téléphone");
      return res.json({
        isValid: false,
        error: "Numéro de téléphone incorrect",
      });
    }

    let foundAdmin = null;
    for (const admin of results) {
      if (!admin.code_admin || typeof admin.code_admin !== "string") {
        logger.error(
          `Code_admin invalide pour l'administrateur clinique : ${admin.id_admin_clinique}`
        );
        continue;
      }

      // Vérifier si le code saisi correspond au code haché
      if (bcrypt.compareSync(code_admin, admin.code_admin)) {
        foundAdmin = admin;
        break;
      }
    }

    if (foundAdmin) {
      // Vérifier si la clinique est active (statut = 1)
      if (foundAdmin.statut === 0) {
        logger.warn(`La clinique ${foundAdmin.id_clinique} n'est pas active.`);
        return res.json({
          isValid: false,
          error: "La clinique à laquelle vous êtes affilié n'est pas active.",
        });
      }

      logger.info(
        `Connexion réussie pour ${telephone} (id_clinique: ${foundAdmin.id_clinique})`
      );

      // Liste des postes ayant une page spécifique
      const rolesSpecifiques = [
        "Administrateur",
        "Administrateur clinique",
        "Administrateur pharmacie",
        "Infirmier",
        "Pharmacien",
        "Secretaire Comptable",
        "Interne/Garde",
        "Laboratin",
      ];

      // Déterminer dynamiquement la page de redirection
      let redirectPage = "";
      if (rolesSpecifiques.includes(foundAdmin.poste)) {
        switch (foundAdmin.poste) {
          case "Administrateur":
            redirectPage = "/admin";
            break;
          case "Administrateur clinique":
            redirectPage = "/admin";
            break;
          case "Administrateur pharmacie":
            redirectPage = "/pharmacie";
            break;
          case "Infirmier":
            redirectPage = "/infirm";
            break;
          case "Pharmacien":
            redirectPage = "/pharmacie";
            break;
          case "Secretaire Comptable":
            redirectPage = "/comptable";
            break;
          case "Interne/Garde":
            redirectPage = "/interne";
            break;
          case "Laboratin":
            redirectPage = "/labo";
            break;
        }
      } else {
        // Si le poste ne fait pas partie des rôles spécifiques, il est redirigé vers `/dog`
        redirectPage = "/dog";
      }

      // Génération du JWT avec l'id_clinique et l'id_admin_clinique inclus
      const token = jwt.sign(
        {
          idAdminClinique: foundAdmin.id_admin_clinique, // Utilisation de id_admin_clinique
          idClinique: foundAdmin.id_clinique, // Stockage de l'id_clinique
          poste: foundAdmin.poste,
        },
        SECRET_KEY,
        { expiresIn: "4h" }
      );

      return res.json({
        isValid: true,
        redirectPage, // Redirection vers l'URL dynamique
        token,
        idClinique: foundAdmin.id_clinique, // Ajout de l'id_clinique dans la réponse
        idAdminClinique: foundAdmin.id_admin_clinique, // Ajout de id_admin_clinique dans la réponse
        poste: foundAdmin.poste,
      });
    } else {
      logger.warn("Code administrateur incorrect");
      return res.json({ isValid: false, error: "Code incorrect" });
    }
  });
});

app.get("/clinique", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const query = `SELECT nom FROM cliniques WHERE id_clinique = ?`;

  db.query(query, [idClinique], (error, results) => {
    if (error) {
      console.error("Erreur lors de la récupération du nom: ", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    // Retourner les informations sur les employés avec leurs salaires et départements
    res.status(200).json(results);
  });
});

// Route pour récupérer les informations des employés avec leurs salaires
app.get("/employes", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;

  if (!idClinique) {
    return res.status(400).json({ message: "L'ID de la clinique est requis." });
  }

  // Requête SQL pour récupérer les employés qui appartiennent à cette clinique
  const query = `
    SELECT 
      a.id_admin_clinique,
      a.nom,
      a.prenom,
      a.mail,
      a.telephone,
      s.salaire_brute,
      s.inps,
      s.amo,
      d.departement
    FROM 
      administration a
    LEFT JOIN 
      salaire s ON a.id_salaire = s.id_salaire
    LEFT JOIN 
      departements d ON a.id_departement = d.id_departement
    WHERE 
      a.id_clinique = ?  
  `;

  db.query(query, [idClinique], (error, results) => {
    if (error) {
      console.error(
        "Erreur lors de la récupération des employés, salaires et départements:",
        error
      );
      return res.status(500).json({ message: "Erreur serveur" });
    }

    // Retourner les informations sur les employés avec leurs salaires et départements
    res.status(200).json(results);
  });
});

app.get("/get_admin/:idAdminClinique", verifyToken, (req, res) => {
  console.log("✅ ID de la clinique extrait du token :", req.user.idClinique);

  const { idAdminClinique } = req.params;
  const idClinique = req.user.idClinique; // Vérification si cette valeur est bien extraite

  if (!idClinique) {
    return res
      .status(403)
      .json({ message: "Accès refusé : ID Clinique manquant dans le token" });
  }

  const sql = `
    SELECT a.*, s.salaire_brute, d.departement, d.poste
    FROM administration a
    LEFT JOIN salaire s ON a.id_salaire = s.id_salaire
    LEFT JOIN departements d ON a.id_departement = d.id_departement
    WHERE a.id_clinique = ? AND a.id_admin_clinique = ?
  `;
  db.query(sql, [idClinique, idAdminClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    console.log("Résultat SQL :", result);

    if (result.length === 0) {
      console.warn("Aucun administrateur trouvé !");
      return res.status(404).json({ message: "Administrateur non trouvé" });
    }

    res.json(result);
  });
});

app.delete("/delete_admin/:idAdminClinique", verifyToken, (req, res) => {
  const idAdminClinique = req.params.idAdminClinique;
  const idClinique = req.user.idClinique; // Récupéré depuis le token JWT

  const sql =
    "DELETE FROM administration WHERE id_admin_clinique = ? AND id_clinique = ?";
  db.query(sql, [idAdminClinique, idClinique], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Une erreur inattendue est survenue: " + err });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Aucun employé trouvé pour cette clinique." });
    }

    return res.status(200).json({ success: "Employé supprimé avec succès" });
  });
});

app.put(
  "/update_admin/:idAdminClinique",
  verifyToken,
  upload.fields([{ name: "profil" }, { name: "identite" }]),
  (req, res) => {
    const id = req.params.idAdminClinique;
    const idClinique = req.user.idClinique;

    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      situation,
      telephone,
      mail,
      departement,
      poste,
      code_admin,
      diplome,
      niveau,
      date_e,
      salaire_brute,
    } = req.body;

    const profil = req.files.profil ? req.files.profil[0] : null;
    const identite = req.files.identite ? req.files.identite[0] : null;

    // Vérifier si l'employé appartient bien à cette clinique
    const getEmployeQuery = `SELECT id_admin_clinique, id_salaire FROM administration WHERE id_admin_clinique = ? AND id_clinique = ?`;
    db.query(getEmployeQuery, [id, idClinique], (err, employeResults) => {
      if (err) {
        console.error("Erreur lors de la récupération de l'employé:", err);
        return res.status(500).json({ message: "Erreur serveur", error: err });
      }

      if (employeResults.length === 0) {
        return res.status(404).json({ message: "Employé non trouvé" });
      }

      let idSalaire = employeResults[0]?.id_salaire;

      if (salaire_brute) {
        // Vérifier si le salaire existe déjà pour cette clinique
        const checkSalaireQuery = `SELECT id_salaire FROM salaire WHERE salaire_brute = ? AND id_clinique = ?`;
        db.query(
          checkSalaireQuery,
          [salaire_brute, idClinique],
          (err, salaireResults) => {
            if (err) {
              console.error("Erreur lors de la vérification du salaire:", err);
              return res
                .status(500)
                .json({ message: "Erreur serveur", error: err });
            }

            if (salaireResults.length === 0) {
              // Insérer un nouveau salaire
              const inps = salaire_brute * 0.036;
              const amo = salaire_brute * 0.0306;

              const salaireQuery = `INSERT INTO salaire (salaire_brute, inps, amo, id_clinique) VALUES (?, ?, ?, ?)`;
              db.query(
                salaireQuery,
                [salaire_brute, inps, amo, idClinique],
                (err, salaireInsertResults) => {
                  if (err) {
                    console.error(
                      "Erreur lors de l'insertion du salaire:",
                      err
                    );
                    return res
                      .status(500)
                      .json({ message: "Erreur serveur", error: err });
                  }
                  idSalaire = salaireInsertResults.insertId;

                  updateEmploye(
                    id,
                    idSalaire,
                    departement,
                    poste,
                    nom,
                    prenom,
                    date_naissance,
                    sexe,
                    situation,
                    telephone,
                    mail,
                    code_admin,
                    diplome,
                    niveau,
                    date_e,
                    profil,
                    identite,
                    res
                  );
                }
              );
            } else {
              idSalaire = salaireResults[0].id_salaire;
              updateEmploye(
                id,
                idSalaire,
                departement,
                poste,
                nom,
                prenom,
                date_naissance,
                sexe,
                situation,
                telephone,
                mail,
                code_admin,
                diplome,
                niveau,
                date_e,
                profil,
                identite,
                res
              );
            }
          }
        );
      } else {
        updateEmploye(
          id,
          idSalaire,
          departement,
          poste,
          nom,
          prenom,
          date_naissance,
          sexe,
          situation,
          telephone,
          mail,
          code_admin,
          diplome,
          niveau,
          date_e,
          profil,
          identite,
          res
        );
      }
    });
  }
);

// Fonction pour mettre à jour l'employé dans la table administration
function updateEmploye(
  id,
  idSalaire,
  departement,
  poste,
  nom,
  prenom,
  date_naissance,
  sexe,
  situation,
  telephone,
  mail,
  code_admin,
  diplome,
  niveau,
  date_e,
  profil,
  identite,
  res
) {
  const departementQuery = `SELECT id_departement FROM departements WHERE departement = ?`;

  db.query(
    departementQuery,
    [departement, poste],
    (err, departementResults) => {
      if (err) {
        console.error("Erreur lors de la vérification du département:", err);
        return res.status(500).json({
          message: "Erreur serveur lors de la vérification du département",
          error: err,
        });
      }

      let idDepartement;
      if (departementResults.length === 0) {
        const insertDepartementQuery = `INSERT INTO departements (departement, poste) VALUES (?, ?)`;
        db.query(
          insertDepartementQuery,
          [departement, poste],
          (err, insertDepartementResults) => {
            if (err) {
              console.error("Erreur lors de l'insertion du département:", err);
              return res.status(500).json({
                message: "Erreur serveur lors de l'insertion du département",
                error: err,
              });
            }
            idDepartement = insertDepartementResults.insertId;
            // Mise à jour de l'employé dans la table administration
            updateEmployeInDb(
              id,
              idSalaire,
              idDepartement,
              nom,
              prenom,
              date_naissance,
              sexe,
              situation,
              telephone,
              mail,
              code_admin,
              diplome,
              niveau,
              date_e,
              profil,
              identite,
              res
            );
          }
        );
      } else {
        idDepartement = departementResults[0].id_departement;
        // Mise à jour de l'employé dans la table administration
        updateEmployeInDb(
          id,
          idSalaire,
          idDepartement,
          nom,
          prenom,
          date_naissance,
          sexe,
          situation,
          telephone,
          mail,
          code_admin,
          diplome,
          niveau,
          date_e,
          profil,
          identite,
          res
        );
      }
    }
  );
}

// Fonction pour effectuer la mise à jour dans la table administration
function updateEmployeInDb(
  id,
  idSalaire,
  idDepartement,
  nom,
  prenom,
  date_naissance,
  sexe,
  situation,
  telephone,
  mail,
  code_admin,
  diplome,
  niveau,
  date_e,
  profil,
  identite,
  res
) {
  // Hacher le code_admin avant de mettre à jour l'employé
  bcrypt.hash(code_admin, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Erreur lors du hachage du mot de passe:", err);
      return res.status(500).json({
        message: "Erreur serveur lors du hachage du mot de passe",
        error: err,
      });
    }

    // Commencer une transaction
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur lors de la création de la transaction",
          error: err,
        });
      }

      const updateAdminQuery = `
        UPDATE administration
        SET nom = ?, prenom = ?, date_naissance = ?, sexe = ?, situation = ?, telephone = ?, mail = ?, 
        id_departement = ?, code_admin = ?, diplome = ?, niveau = ?, date_e = ?, id_salaire = ?, profil = ?, identite = ?
        WHERE id_admin_clinique = ?
      `;

      db.query(
        updateAdminQuery,
        [
          nom,
          prenom,
          date_naissance,
          sexe,
          situation,
          telephone,
          mail,
          idDepartement,
          hashedPassword, // Utiliser le mot de passe haché
          diplome,
          niveau,
          date_e,
          idSalaire,
          profil ? profil.path : null,
          identite ? identite.path : null,
          id,
        ],
        (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({
                message: "Erreur lors de la mise à jour de l'administration",
                error: err,
              });
            });
          }

          const updateVenteQuery = `
            UPDATE vente 
            SET code_admin = ?
            WHERE code_admin = ?
          `;
          db.query(
            updateVenteQuery,
            [hashedPassword, code_admin],
            (err, results) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({
                    message: "Erreur lors de la mise à jour de la vente",
                    error: err,
                  });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({
                      message: "Erreur lors de la validation de la transaction",
                      error: err,
                    });
                  });
                }
                res.status(200).json({
                  message: "Employé et ventes mis à jour avec succès !",
                });
              });
            }
          );
        }
      );
    });
  });
}

app.get("/historique-achat", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;

  const query = `
    SELECT 
    h.id_achat,
    m.nom,
    m.forme,
    m.dosage,
    h.prix_achat,
    h.date_achat,
    h.quantite,
    h.fournisseur,
    h.num_fournisseur,
    (quantite * prix_achat) AS montant_achat
FROM 
    historique_achats h
JOIN 
    medicaments m
ON 
    h.id_medicament = m.id_medicament WHERE h.id_clinique = ?;
  `;

  db.query(query, idClinique, (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération de l'historique des achats:",
        err
      );
      return res
        .status(500)
        .json({ message: "Erreur lors de la récupération des données" });
    }

    res.status(200).json(results);
  });
});

app.get("/view/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM consultation WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des données :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (result.length > 0) {
      return res.json(result[0]); // Renvoyer seulement le premier élément du tableau
    } else {
      return res.status(404).json({ error: "Patient non trouvé" });
    }
  });
});

app.get("/viewa/:id", (req, res) => {
  const id = req.params.id; // Utilise "id" comme défini dans l'URL
  const sql = "SELECT * FROM patient WHERE id_patient = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des données :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (result.length > 0) {
      return res.json(result[0]); // Renvoyer seulement le premier élément du tableau
    } else {
      return res.status(404).json({ error: "Patient non trouvé" });
    }
  });
});

{
  /* FIN ADMINISTRATION*/
}

{
  /* DEBUT COMPTE ADMINISTRATION*/
}

function getAdminById(idClinique, idAdminClinique, res) {
  const sql = `
    SELECT nom, prenom, profil 
    FROM administration 
    WHERE id_clinique = ? AND id_admin_clinique = ?
  `;

  db.query(sql, [idClinique, idAdminClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun administrateur trouvé avec ces identifiants" });
    }

    // Modifier le chemin pour utiliser l'URL publique
    const admin = result[0];
    const fileName = path.basename(admin.profil); // Extraire le nom du fichier
    admin.profil = `/images/${fileName}`; // Ajouter le chemin public

    res.json(admin);
  });
}

// Route pour récupérer les informations de l'administrateur en fonction de id_admin_clinique et id_clinique
app.get("/admin/info/:idClinique/:idAdminClinique", (req, res) => {
  const { idClinique, idAdminClinique } = req.params; // Récupérer les IDs depuis l'URL
  getAdminById(idClinique, idAdminClinique, res);
});

app.get("/dog/info/:idClinique/:idAdminClinique", (req, res) => {
  const { idClinique, idAdminClinique } = req.params; // Récupérer les IDs depuis l'URL
  getAdminById(idClinique, idAdminClinique, res);
});

{
  /* FIN COMPTE ADMINISTRATION*/
}

{
  /* DEBUT PATIENT*/
}

app.post("/add", verifyToken, (req, res) => {
  console.log("Données reçues :", req.body);
  const {
    telephone,
    nom,
    prenom,
    age,
    sexe,
    ethnie,
    localite,
    tension,
    temperature,
    poids,
    type_soin,
    code_admin,
  } = req.body;

  const idClinique = req.user.idClinique;

  // Vérification si le code est fourni et valide
  if (
    !code_admin ||
    typeof code_admin !== "string" ||
    code_admin.trim() === ""
  ) {
    console.error("Code administrateur manquant ou invalide");
    return res
      .status(400)
      .json({ error: "Code administrateur manquant ou invalide" });
  }

  // Récupérer tous les administrateurs depuis la base de données
  const getAdminsQuery =
    "SELECT id_admin_clinique, code_admin FROM administration WHERE id_clinique = ?";
  db.query(getAdminsQuery, idClinique, (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des administrateurs :",
        err
      );
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }

    let foundAdmin = null;
    for (const admin of results) {
      if (
        admin.code_admin &&
        bcrypt.compareSync(code_admin, admin.code_admin)
      ) {
        foundAdmin = admin;
        break;
      }
    }

    if (!foundAdmin) {
      console.error("Code administrateur incorrect");
      return res.status(401).json({ error: "Code administrateur incorrect" });
    }

    console.log("Administrateur validé :", foundAdmin.id_admin_clinique);

    // Vérifier l'ID du soin basé sur le type de soin
    const getIdSoinQuery =
      "SELECT id_soin FROM soins WHERE type_soin = ? AND id_clinique = ?";
    db.query(getIdSoinQuery, [type_soin, idClinique], (err, results) => {
      if (err) {
        console.error("Erreur lors de la récupération du soin :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération du soin" });
      }

      if (results.length === 0) {
        console.error("Type de soin invalide :", type_soin);
        return res.status(400).json({ error: "Type de soin invalide" });
      }

      const id_soin = results[0].id_soin;
      console.log("ID du soin trouvé :", id_soin);

      // Ajouter le patient
      const addPatientQuery =
        "INSERT INTO patient (telephone, nom, prenom, age, sexe, ethnie, localite, tension, poids, temperature, type_soin, code_admin, id_clinique) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const patientValues = [
        telephone,
        nom,
        prenom,
        age,
        sexe,
        ethnie,
        localite,
        tension,
        poids,
        temperature,
        type_soin,
        foundAdmin.code_admin, // Utilisez le code haché ici
        idClinique,
      ];

      db.query(addPatientQuery, patientValues, (insertErr, result) => {
        if (insertErr) {
          return handleError(
            insertErr,
            res,
            "Erreur lors de l'ajout du Patient."
          );
        }

        console.log("Patient ajouté avec succès");

        // Mettre à jour le nombre de consultations
        const incrementConsultationsQuery =
          "UPDATE administration SET nombre_consultation = nombre_consultation + 1 WHERE id_admin_clinique = ? AND id_clinique = ?";
        db.query(
          incrementConsultationsQuery,
          [foundAdmin.id_admin_clinique, idClinique],
          (err) => {
            if (err) {
              console.error(
                "Erreur lors de l'incrémentation des consultations :",
                err
              );
              return res.status(500).json({
                error: "Erreur lors de la mise à jour des consultations",
              });
            }

            console.log(
              "Nombre de consultations mis à jour pour l'administrateur"
            );

            // Génération de la facture
            const getPrixQuery =
              "SELECT prix FROM soins WHERE id_soin = ? AND id_clinique = ?";
            db.query(
              getPrixQuery,
              [id_soin, idClinique],
              (err, prixResults) => {
                if (err || prixResults.length === 0) {
                  console.error(
                    "Erreur lors de la récupération du prix :",
                    err
                  );
                  return handleError(
                    err,
                    res,
                    "Erreur lors de la récupération du prix"
                  );
                }

                const prix = parseFloat(prixResults[0].prix).toFixed(2);

                const date = new Date();
                const formattedDate =
                  date.getDate().toString().padStart(2, "0") +
                  "/" +
                  (date.getMonth() + 1).toString().padStart(2, "0") +
                  "/" +
                  date.getFullYear();

                const getCliniqueQuery =
                  "SELECT nom, adresse, telephone FROM cliniques WHERE id_clinique = ?";

                db.query(
                  getCliniqueQuery,
                  [idClinique],
                  (err, cliniqueResults) => {
                    if (err || cliniqueResults.length === 0) {
                      console.error(
                        "Erreur lors de la récupération des infos de la clinique :",
                        err
                      );
                      return handleError(
                        err,
                        res,
                        "Erreur lors de la récupération des infos de la clinique"
                      );
                    }

                    const { nom, adresse, telephone } = cliniqueResults[0];

                    // Appel à ta fonction avec les nouvelles infos ajoutées
                    generateInvoicHtml(
                      nom,
                      prenom,
                      age,
                      localite,
                      type_soin,
                      prix,
                      formattedDate,
                      nom,
                      adresse,
                      telephone
                    )
                      .then(() => console.log("Facture générée avec succès"))
                      .catch((err) =>
                        console.error(
                          "Erreur de génération de la facture :",
                          err
                        )
                      );

                    // Envoie la réponse après démarrage de la génération
                    res.json({
                      success: true,
                      message: "Patient ajouté, facture en cours de création",
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
});

function generateInvoicHtml(
  nom,
  prenom,
  age,
  localite,
  type_soin,
  prix,
  formattedDate,
  nom_clinique,
  adresse_clinique,
  telephone_clinique
) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, "public", "facture.html"),
      "utf8",
      (err, templateHtml) => {
        if (err) {
          console.error("Erreur de lecture du modèle de facture :", err);
          return reject(err);
        }

        const finalHtml = templateHtml
          .replace("{{imgHtml}}", logoBase64)
          .replace("{{nom}}", nom)
          .replace("{{prenom}}", prenom)
          .replace("{{age}}", age)
          .replace("{{type_soin}}", type_soin)
          .replace("{{localite}}", localite)
          .replace("{{prix}}", prix)
          .replace("{{date}}", formattedDate)
          .replace("{{nom_clinique}}", nom_clinique)
          .replace("{{adresse_clinique}}", adresse_clinique)
          .replace("{{telephone_clinique}}", telephone_clinique);

        generateFactureFromHtml(finalHtml).then(resolve).catch(reject);
      }
    );
  });
}

async function generateFactureFromHtml(htmlContent, res) {
  const browser = await puppeteer.launch({
    headless: "new", // Utiliser le nouveau mode headless
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Éviter les restrictions de sandboxing
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { timeout: 60000 });

  const pdfPath = path.join(downloadsPath, `facture_${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4" });

  await browser.close();
  console.log("Facture générée avec succès !");

  res.status(200).json({
    message: "Vente effectuée avec succès et facture générée.",
    pdfPath: pdfPath,
  });
}

function getPatientsByPoste(postes, id_clinique, res) {
  const sql = `
    SELECT 
  p.*
FROM 
  patient p
JOIN 
  soins s ON p.type_soin = s.type_soin
JOIN 
  departements d ON s.id_departement = d.id_departement
WHERE d.poste LIKE ? AND d.id_clinique = ?
  `;

  // Si `postes` est un tableau, on passe tous les éléments, sinon un seul poste
  db.query(sql, [postes, id_clinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur", error: err });
    }
    res.json(result);
  });
}

// Endpoints pour chaque département, incluant id_clinique
app.get("/dog", verifyToken, (req, res) => {
  const id_clinique = req.user.idClinique;
  const poste = req.user.poste; // Récupération du poste de l'utilisateur

  // Passer dynamiquement le poste de l'utilisateur
  getPatientsByPoste(`%${poste}%`, id_clinique, res);
});

app.get("/infirm/patient", verifyToken, (req, res) => {
  const id_clinique = req.user.idClinique;
  getPatientsByPoste("%Infirmier%", id_clinique, res);
});

app.get("/interne/patient", verifyToken, (req, res) => {
  const id_clinique = req.user.idClinique;
  getPatientsByPoste("%Infirmier%", id_clinique, res);
});

app.get("/labo", verifyToken, (req, res) => {
  const id_clinique = req.user.idClinique;
  getPatientsByPoste("%Laboratin%", id_clinique, res);
});

app.get("/admin", verifyToken, (req, res) => {
  const id_clinique = req.user.idClinique;

  const sql = `SELECT * FROM patient WHERE id_clinique = ?`;
  db.query(sql, [id_clinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    res.json(result); // Envoyer les données filtrées
  });
});

// Route GET pour récupérer les données du patient par son ID
app.get("/get_patient/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM patient WHERE id_patient = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération du patient:", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la récupération du patient." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Patient non trouvé." });
    }
    return res.status(200).json(result[0]); // Retourne les données du patient
  });
});

app.get("/get_agenda/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM agenda WHERE id_agenda = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des données :", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(result);
    }
  });
});

app.delete("/delete_patient/:id", (req, res) => {
  const id = req.params.id;
  console.log("ID reçu pour suppression :", id); // Vérifiez que l'ID est correct

  const sql = "DELETE FROM patient WHERE id_patient=?";
  const values = [id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur interne", error: err });
    }

    console.log("Résultat de la requête :", result);

    if (result.affectedRows === 0) {
      console.warn("Aucune ligne affectée. Patient non trouvé.");
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    console.log("Patient supprimé avec succès !");
    return res.status(200).json({ success: "Patient supprimé avec succès" });
  });
});

app.delete("/delete_agenda/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM agenda WHERE id_agenda=?";
  const values = [id];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({ message: "Something unexpected has occured" + err });
    return res.json({ success: "Student updated successfully" });
  });
});

{
  /* FIN PATIENT*/
}

{
  /* DEBUT CONSULATION*/
}

app.post(
  "/add_consultation",
  upload.single("fichier"),
  verifyToken,
  (req, res) => {
    const {
      id_patient,
      nom,
      prenom,
      age,
      sexe,
      ethnie,
      telephone,
      localite,
      tension,
      poids,
      temperature,
      type_soin, // Utilisation de type_soin ici
      diagnostique,
      prescription,
      id_admin_clinique,
    } = req.body;
    const fichier = req.file ? `/images/${req.file.filename}` : null;
    const idClinique = req.user.idClinique;

    // Étape 1 : Récupérer le prix depuis la table soins en fonction de type_soin
    const getPrixQuery =
      "SELECT prix FROM soins WHERE type_soin = ? AND id_clinique = ?"; // Modification ici pour utiliser type_soin
    db.query(getPrixQuery, [type_soin, idClinique], (err, result) => {
      if (err) {
        console.error("Erreur lors de la récupération du prix :", err);
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération du montant." });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Type de soin introuvable." });
      }

      const montant = result[0].prix; // Récupération du prix

      // Étape 2 : Insérer la consultation dans la table consultation
      const insertConsultationQuery = `
      INSERT INTO consultation (
        id_patient, nom, prenom, age, sexe, ethnie, telephone, localite, tension, poids, temperature,
        type_soin, diagnostique, prescription, montant, id_admin_clinique, fichier, id_clinique
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const consultationValues = [
        id_patient,
        nom,
        prenom,
        age,
        sexe,
        ethnie,
        telephone,
        localite,
        tension,
        poids,
        temperature,
        type_soin, // Envoi de type_soin pour la consultation
        diagnostique,
        prescription,
        montant, // Le prix récupéré est inséré ici
        id_admin_clinique,
        fichier,
        idClinique,
      ];

      db.query(insertConsultationQuery, consultationValues, (insertErr) => {
        if (insertErr) {
          console.error(
            "Erreur lors de l'insertion de la consultation :",
            insertErr
          );
          return res
            .status(500)
            .json({ error: "Erreur lors de l'ajout de la consultation." });
        }

        // Étape 3 : Mettre à jour le nombre de consultations pour le médecin
        const updateMedecinQuery =
          "UPDATE administration SET nombre_consultation = nombre_consultation + 1 WHERE id_admin_clinique = ? AND id_clinique = ?";
        db.query(
          updateMedecinQuery,
          [id_admin_clinique, idClinique],
          (updateErr) => {
            if (updateErr) {
              console.error(
                "Erreur lors de la mise à jour du médecin :",
                updateErr
              );
              return res
                .status(500)
                .json({ error: "Erreur lors de la mise à jour du médecin." });
            }

            // Étape 4 : Répondre avec succès après toutes les opérations
            res.status(200).json({
              message:
                "Consultation ajoutée et nombre de consultations mis à jour avec succès !",
            });
          }
        );
      });
    });
  }
);

function getConsultationByPoste(poste, idClinique, res) {
  const sql = `
    SELECT 
      c.* 
    FROM 
      consultation c
    JOIN 
      administration a ON c.id_admin_clinique = a.id_admin_clinique
      AND a.id_clinique = c.id_clinique
    JOIN 
      departements d ON a.id_departement = d.id_departement
    WHERE 
      d.poste LIKE ? AND c.id_clinique = ?
  `;

  db.query(sql, [poste, idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucune consultation trouvée pour ce département" });
    }

    console.log("Résultats de la requête : ", result);
    res.json(result);
  });
}

app.get("/dog/arch", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const poste = req.user.poste; // Récupération du poste de l'utilisateur

  // Passer dynamiquement le poste de l'utilisateur
  getConsultationByPoste(`%${poste}%`, idClinique, res);
});

app.get("/infirm/arch", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  getConsultationByPoste("%Infirmier%", idClinique, res);
});

app.get("/admin/arch", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const sql = `SELECT * FROM consultation WHERE id_clinique = ?`;
  db.query(sql, [idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(result);
  });
});

app.get("/adminc/arch", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const sql = `SELECT * FROM consultation WHERE id_clinique = ?`;
  db.query(sql, [idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(result);
  });
});

{
  /* FIN CONSULATION*/
}

{
  /* DEBUT AGENDA*/
}

// Route POST pour insérer dans l'agenda
app.post("/add_agenda", verifyToken, (req, res) => {
  const {
    id_patient,
    nom,
    prenom,
    age,
    sexe,
    ethnie,
    telephone,
    localite,
    tension,
    poids,
    temperature,
    type_soin,
    diagnostique,
    prescription,
    id_admin_clinique,
    date,
    heure,
  } = req.body;
  const idClinique = req.user.idClinique;
  // Vérification des données
  if (!id_patient || !nom || !prenom || !date || !heure) {
    return res.status(400).json({
      message: "Toutes les informations nécessaires ne sont pas fournies.",
    });
  }
  // Requête SQL pour insérer dans l'agenda
  const queryAgenda = `
    INSERT INTO agenda (id_patient, nom, prenom, age, sexe, ethnie, telephone, localite, tension, poids, temperature, type_soin, diagnostique, prescription, id_admin_clinique, date, heure, id_clinique)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    queryAgenda,
    [
      id_patient,
      nom,
      prenom,
      age,
      sexe,
      ethnie,
      telephone,
      localite,
      tension,
      poids,
      temperature,
      type_soin,
      diagnostique,
      prescription,
      id_admin_clinique,
      date,
      heure,
      idClinique,
    ],
    (err, result) => {
      if (err) {
        console.error("Erreur lors de l'insertion dans agenda:", err);
        return res
          .status(500)
          .json({ message: "Erreur lors de l'insertion dans agenda." });
      }

      console.log("Données insérées dans agenda:", result);

      // Si l'insertion est réussie, supprimer les données du patient de la table patient
      const queryDeletePatient = "DELETE FROM patient WHERE id_patient = ?";
      db.query(queryDeletePatient, [id_patient], (errDelete) => {
        if (errDelete) {
          console.error("Erreur lors de la suppression du patient:", errDelete);
          return res
            .status(500)
            .json({ message: "Erreur lors de la suppression du patient." });
        }

        console.log("Patient supprimé de la table patient");
        return res.status(200).json({
          message:
            "Données insérées dans l'agenda et patient supprimé avec succès.",
        });
      });
    }
  );
});
// Route PUT pour Mettre à jour dans l'agenda
app.put("/update_agenda/:id", (req, res) => {
  const {
    nom,
    prenom,
    age,
    sexe,
    ethnie,
    telephone,
    localite,
    tension,
    poids,
    temperature,
    diagnostique,
    prescription,
    id_admin_clinique,
    id_patient,
    date,
    heure,
    id_agenda,
  } = req.body;

  const updateQuery = `
    UPDATE agenda
    SET 
      diagnostique = ?, 
      prescription = ?, 
      date = ?, 
      heure = ?, 
      nom = ?, 
      prenom = ?, 
      age = ?, 
      sexe = ?, 
      ethnie = ?, 
      telephone = ?, 
      localite = ?, 
      tension = ?, 
      poids = ?, 
      temperature = ?,
      id_admin_clinique = ?, 
      id_patient = ?
    WHERE id_agenda = ?`;

  db.query(
    updateQuery,
    [
      diagnostique,
      prescription,
      date,
      heure,
      nom,
      prenom,
      age,
      sexe,
      ethnie,
      telephone,
      localite,
      tension,
      poids,
      temperature,
      id_admin_clinique,
      id_patient,
      id_agenda,
    ],
    (err, updateResults) => {
      if (err) {
        console.error("Erreur lors de la mise à jour de l'agenda :", err);
        return res.status(500).json({
          error: "Erreur lors de la mise à jour de l'agenda.",
          details: err.message,
        });
      }

      console.log("Mise à jour de l'agenda réussie :", updateResults);
      res.status(200).json({ message: "Agenda mis à jour avec succès !" });
    }
  );
});

function getAgendaByPoste(poste, idClinique, res) {
  const sql = `
    SELECT a.*
FROM agenda a
JOIN administration b 
  ON a.id_admin_clinique = b.id_admin_clinique 
  AND a.id_clinique = b.id_clinique
JOIN departements d 
  ON b.id_departement = d.id_departement
WHERE d.poste LIKE ? AND a.id_clinique = ?
  `;

  db.query(sql, [poste, idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (result.length === 0) {
      return res.status(200).json([]); // ✅ Retourne un tableau vide
    }

    console.log("Résultats de la requête : ", result);
    res.json(result);
  });
}

app.get("/dog/agenda", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const poste = req.user.poste; // Récupération du poste de l'utilisateur

  // Passer dynamiquement le poste de l'utilisateur
  getAgendaByPoste(`%${poste}%`, idClinique, res);
});

app.get("/infirm/agenda", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  getAgendaByPoste("%Infirmier%", idClinique, res);
});

app.get("/admin/agenda", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const sql = `SELECT * FROM agenda WHERE id_clinique = ?`;
  db.query(sql, [idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(result);
  });
});

app.get("/adminc/agenda", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const sql = `SELECT * FROM agenda WHERE id_clinique = ?`;
  db.query(sql, idClinique, (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(result);
  });
});

{
  /* FIN AGENDA*/
}

{
  /* DEBUT Salaire*/
}

app.post("/paiement", verifyToken, async (req, res) => {
  const { id_admin_clinique, salaire_brute, sur_salaire, prime, avance, its } =
    req.body;
  const idClinique = req.user.idClinique;

  // Récupérer les informations de salaire depuis la table 'salaire' pour AMO et INPS
  const querySalaire =
    "SELECT id_salaire, amo, inps FROM salaire WHERE salaire_brute = ? AND id_clinique = ?";

  db.query(
    querySalaire,
    [salaire_brute, idClinique],
    async (err, salaireResults) => {
      if (err) {
        console.error("Erreur lors de la récupération du salaire:", err);
        return res.status(500).json({ message: "Erreur serveur", error: err });
      }

      if (salaireResults.length === 0) {
        return res
          .status(400)
          .json({ message: "Le salaire brut spécifié n'existe pas." });
      }

      const salaireData = salaireResults[0];
      const idSalaire = salaireData.id_salaire;
      const amo = salaireData.amo;
      const inps = salaireData.inps;

      // Calcul du salaire net
      const net =
        salaire_brute + sur_salaire + prime - inps - amo - avance - its;

      // Récupérer le nom et le prénom de l'employé
      const queryAdmin =
        "SELECT nom, prenom, telephone, mail FROM administration WHERE id_admin_clinique = ? AND id_clinique = ?";
      db.query(
        queryAdmin,
        [id_admin_clinique, idClinique],
        async (err, adminResults) => {
          if (err) {
            console.error(
              "Erreur lors de la récupération des informations de l'employé:",
              err
            );
            return res
              .status(500)
              .json({ message: "Erreur serveur", error: err });
          }

          if (adminResults.length === 0) {
            return res
              .status(400)
              .json({ message: "L'employé avec cet ID n'existe pas." });
          }

          const adminData = adminResults[0];
          const nomEmploye = adminData.nom;
          const prenomEmploye = adminData.prenom;
          const telephoneEmploye = adminData.telephone;
          const mailEmploye = adminData.mail;

          // Vérifier si l'employé a une avance dans la table 'avance_salaire'
          const queryAvance =
            "SELECT * FROM avance_salaire WHERE id_admin_clinique = ? AND id_clinique AND montant_avance > 0";
          db.query(
            queryAvance,
            [id_admin_clinique, idClinique],
            async (err, avanceResults) => {
              if (err) {
                console.error(
                  "Erreur lors de la récupération de l'avance:",
                  err
                );
                return res
                  .status(500)
                  .json({ message: "Erreur serveur", error: err });
              }

              let avanceMontant = 0;
              if (avanceResults.length > 0) {
                avanceMontant = avanceResults[0].montant_avance;
              }

              // Soustraire l'avance du montant net à payer
              const montantApayer = net - avanceMontant;
              const montatTotal = salaire_brute + prime + sur_salaire;

              // Vérifier si un paiement a déjà été effectué
              const queryCheckPaiement = `
          SELECT * FROM paiement 
          WHERE id_admin_clinique = ? AND id_clinique = ? 
          AND MONTH(date_paiement) = MONTH(CURRENT_DATE()) 
          AND YEAR(date_paiement) = YEAR(CURRENT_DATE())
        `;

              db.query(
                queryCheckPaiement,
                [id_admin_clinique, idClinique],
                async (err, result) => {
                  if (err) {
                    console.error(
                      "Erreur lors de la vérification du paiement:",
                      err
                    );
                    return res
                      .status(500)
                      .json({ message: "Erreur serveur", error: err });
                  }

                  // Si un paiement existe déjà, ne pas insérer un nouveau paiement
                  if (result.length > 0) {
                    return res.status(200).json({
                      message:
                        "Un paiement a déjà été effectué ce mois-ci pour cet employé.",
                    });
                  }

                  // Formater la date
                  const datePaiement = new Date();
                  const dateStr = datePaiement.toISOString().split("T")[0]; // Format 'YYYY-MM-DD'
                  const fichePath = path.join(
                    os.homedir(),
                    "Desktop",
                    "fiche_paie",
                    `fiche_paie_${id_admin_clinique}_${dateStr}.pdf`
                  );

                  // Générer la fiche de paie en HTML
                  const htmlContent = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
        }
        .title {
          text-align: center;
          font-size: 24px;
          margin-bottom: 20px;
          background-color: #28a745; /* Fond vert */
          color: white;
          padding: 10px;
          width: 100%; /* Pour que le fond couvre toute la largeur */
          box-sizing: border-box; /* Pour inclure le padding dans la largeur totale */
        }
        .section {
          margin-bottom: 20px;
        }
        .section p {
          margin: 5px 0;
        }
        .section strong {
          width: 150px;
          display: inline-block;
        }
        .employee-info {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        .employee-info div {
          width: 48%;
        }
        .employee-info div.phone {
          margin-top: 10px;
        }
        .salary-info {
          margin-top: 20px;
          background-color: #28a745; /* Fond vert */
          color: white;
          padding: 10px;
          text-align: center;
          width: 100%; /* Pour que le fond couvre toute la largeur */
          box-sizing: border-box; /* Pour inclure le padding dans la largeur totale */
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 14px;
        }
        /* Ajout du fond vert uniquement pour Salaire Brut et Salaire Net */
        .salary-line {
          background-color: #28a745; /* Fond vert */
          color: white;
          padding: 5px 10px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="title">
        <h1>Fiche de Paie</h1>
      </div>
  
      <div class="section">
        <div class="employee-info">
          <div>
            <p><strong>Nom de l'employé:</strong> ${nomEmploye} ${prenomEmploye}</p>
          </div>
          <div>
            <p><strong>Email:</strong> ${mailEmploye}</p>
          </div>
        </div>
  
        <div class="employee-info">
          <div>
            <p><strong>Téléphone:</strong> ${telephoneEmploye}</p>
          </div>
        </div>
      </div>
  
      <div class="section">
        <div class="salary-line">
          <p><strong>Salaire Brut:</strong> ${salaire_brute} FCFA</p>
        </div>
        <p><strong>Sur-salaire:</strong> ${sur_salaire} FCFA</p>
        <p><strong>Prime:</strong> ${prime} FCFA</p>
        <p><strong>Avance:</strong> ${avance} FCFA</p>
        <p><strong>AMO:</strong> ${amo} FCFA</p>
        <p><strong>INPS:</strong> ${inps} FCFA</p>
        <p><strong>ITS:</strong> ${its} FCFA</p>
        <div class="salary-line">
          <p><strong>Salaire Net:</strong> ${net} FCFA</p>
        </div>
      </div>
  
      <div class="salary-info">
        <p><strong>Montant total payé par l'employeur :</strong> ${montatTotal} FCFA</p>
      </div>
  
      <div class="footer">
        <p>Date de paiement : ${dateStr}.</p>
      </div>
    </body>
  </html>
`;

                  const browser = await puppeteer.launch();
                  const page = await browser.newPage();
                  await page.setContent(htmlContent);
                  await page.pdf({ path: fichePath, format: "A4" });

                  await browser.close();

                  // Insérer le paiement dans la table 'paiement'
                  const queryInsertPaiement = `
    INSERT INTO paiement 
    (id_salaire, sur_salaire, prime, inps, amo, its, avance, net, date_paiement, id_admin_clinique, id_clinique)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

                  const queryDeleteAvance = `
    DELETE FROM avance_salaire 
    WHERE id_admin_clinique = ? AND id_clinique = ?
  `;

                  // Exécuter l'insertion du paiement
                  db.query(
                    queryInsertPaiement,
                    [
                      idSalaire,
                      sur_salaire,
                      prime,
                      inps,
                      amo,
                      its,
                      avanceMontant,
                      net,
                      datePaiement,
                      id_admin_clinique,
                      idClinique,
                    ],
                    (err, result) => {
                      if (err) {
                        console.error(
                          "Erreur lors de l'insertion du paiement:",
                          err
                        );
                        return res.status(500).json({
                          message:
                            "Erreur serveur lors de l'insertion du paiement",
                          error: err,
                        });
                      }

                      // Si l'insertion du paiement réussit, on supprime l'avance_salaire
                      db.query(
                        queryDeleteAvance,
                        [id_admin_clinique, idClinique],
                        (err, result) => {
                          if (err) {
                            console.error(
                              "Erreur lors de la suppression de l'avance salaire:",
                              err
                            );
                            return res.status(500).json({
                              message:
                                "Paiement effectué, mais erreur lors de la suppression de l'avance salaire",
                              error: err,
                            });
                          }

                          // Renvoyer la fiche de paie générée au frontend
                          res.status(200).json({
                            message: "Paiement effectué avec succès",
                            fichePaieUrl: fichePath, // URL du fichier généré pour téléchargement
                          });
                        }
                      );
                    }
                  );

                  await browser.close(); // Fermer le navigateur Puppeteer
                }
              );
            }
          );
        }
      );
    }
  );
});

app.post("/avance_salaire", verifyToken, (req, res) => {
  const { id_admin_clinique, montant_avance, date_avance } = req.body;
  const idClinique = req.user.idClinique; // Récupération de l'ID de la clinique depuis le token

  // Vérifier si l'employé appartient bien à la clinique
  const queryVerifAdmin = `
    SELECT * FROM administration 
    WHERE id_admin_clinique = ? AND id_clinique = ?`;

  db.query(queryVerifAdmin, [id_admin_clinique, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'employé:", err);
      return res.status(500).json({ message: "Erreur serveur", error: err });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Employé introuvable ou non autorisé." });
    }

    // Si l'employé existe et appartient bien à la clinique, insérer l'avance
    const queryInsertAvance = `
      INSERT INTO avance_salaire (id_admin_clinique, id_clinique, montant_avance, date_avance)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      queryInsertAvance,
      [id_admin_clinique, idClinique, montant_avance, date_avance],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de l'ajout de l'avance:", err);
          return res.status(500).json({
            message: "Erreur serveur lors de l'ajout de l'avance",
            error: err,
          });
        }

        res.status(200).json({
          message: "Avance ajoutée avec succès.",
          id_avance: result.insertId,
        });
      }
    );
  });
});

// Nouvelle route pour récupérer les informations salariales basées sur l'id_admin
app.get("/salaire/:idAdminClinique", verifyToken, (req, res) => {
  const idAdminClinique = req.params.idAdminClinique;
  const idClinique = req.user.idClinique; // Récupération de l'ID de la clinique depuis le token

  // Vérifier que l'utilisateur appartient bien à la clinique
  const queryAdmin =
    "SELECT id_salaire FROM administration WHERE id_admin_clinique = ? AND id_clinique = ?";

  db.query(queryAdmin, [idAdminClinique, idClinique], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération de l'ID salaire :", err);
      return res
        .status(500)
        .send("Erreur serveur lors de la récupération du salaire");
    }

    if (result.length === 0) {
      return res
        .status(404)
        .send("Aucun salaire trouvé pour cet employé dans cette clinique");
    }

    const idSalaire = result[0].id_salaire;

    // Requête pour récupérer les informations salariales
    const querySalaire =
      "SELECT salaire_brute, amo, inps FROM salaire WHERE id_salaire = ? AND id_clinique = ?";
    db.query(querySalaire, [idSalaire, idClinique], (err, result) => {
      if (err) {
        console.error(
          "Erreur lors de la récupération des informations salariales :",
          err
        );
        return res
          .status(500)
          .send(
            "Erreur serveur lors de la récupération des informations salariales"
          );
      }

      if (result.length === 0) {
        return res.status(404).send("Informations salariales introuvables");
      }

      res.json(result[0]); // Renvoi des données salariales
    });
  });
});

// Route pour récupérer l'avance d'un employé
app.get("/avance_salaire/:idAdminClinique", verifyToken, (req, res) => {
  const idAdminClinique = req.params.idAdminClinique;
  const idClinique = req.user.idClinique; // Récupération de l'ID de la clinique depuis le token

  // Vérification que l'employé appartient bien à la clinique
  const query = `
    SELECT montant_avance 
    FROM avance_salaire 
    WHERE id_admin_clinique = ? AND id_clinique = ?`;

  db.query(query, [idAdminClinique, idClinique], (err, result) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération de l'avance sur salaire :",
        err
      );
      return res.status(500).send("Erreur interne du serveur");
    }

    if (result.length === 0) {
      // Si aucune avance n'est trouvée, renvoyer une avance de 0
      return res.json({ avance: 0 });
    }

    // Si l'avance est trouvée, renvoyer l'avance
    return res.json({ avance: result[0].montant_avance });
  });
});

// Route GET pour récupérer toutes les informations de la table "salaire"
app.get("/salaire", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique; // Récupération de l'ID de la clinique depuis le token

  const query = "SELECT * FROM salaire WHERE id_clinique = ?";

  db.query(query, [idClinique], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des salaires liés à la clinique :",
        err
      );
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des données" });
      return;
    }

    res.status(200).json(results);
  });
});

app.get("/get_salaire/idAdminClinique", verifyToken, (req, res) => {
  const idAdminClinique = req.params.idAdminClinique;
  const idClinique = req.user.idClinique;

  const query =
    "SELECT * FROM salaire WHERE id_clinique = ? AND id_salaire = ?";

  db.query(query, [idAdminClinique, idClinique], (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération du salaire:", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la récupération du salaire." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "salaire non trouvé." });
    }
    return res.status(200).json(result[0]); // Retourne les données du salaire
  });
});

app.put("/update_salaire/:id", verifyToken, (req, res) => {
  const { salaire_base, salaire_brute, inps, amo } = req.body;
  const id_salaire = req.params.id; // Récupérer l'ID du salaire depuis l'URL
  const idClinique = req.user.idClinique; // Récupérer l'ID de la clinique depuis le token

  // Vérifier que l'identifiant est bien défini
  if (!id_salaire) {
    return res
      .status(400)
      .json({ message: "L'identifiant du salaire est requis." });
  }

  // Vérifier si le salaire appartient bien à la clinique de l'utilisateur
  const checkSalaireQuery = `
    SELECT id_salaire FROM salaire WHERE id_salaire = ? AND id_clinique = ?
  `;

  db.query(checkSalaireQuery, [id_salaire, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification du salaire :", err);
      return res
        .status(500)
        .json({ error: "Erreur serveur.", details: err.message });
    }

    if (results.length === 0) {
      return res.status(403).json({
        message: "Accès refusé. Salaire non trouvé pour cette clinique.",
      });
    }

    // Mise à jour du salaire si l'accès est valide
    const updateQuery = `
      UPDATE salaire
      SET 
        salaire_base = ?, 
        salaire_brute = ?, 
        inps = ?, 
        amo = ?
      WHERE id_salaire = ? AND id_clinique = ?
    `;

    db.query(
      updateQuery,
      [salaire_base, salaire_brute, inps, amo, id_salaire, idClinique],
      (err, updateResults) => {
        if (err) {
          console.error("Erreur lors de la mise à jour du salaire :", err);
          return res.status(500).json({
            error: "Erreur lors de la mise à jour du salaire.",
            details: err.message,
          });
        }

        res.status(200).json({ message: "Salaire mis à jour avec succès !" });
      }
    );
  });
});

{
  /* FIN Salaire*/
}

{
  /* DEBUT Pharmacie*/
}

app.post("/add-medicament", async (req, res) => {
  const {
    nom,
    forme,
    dosage,
    posologie,
    stock_courant,
    prix_achat,
    prix_unitaire,
    date_achat,
    date_peremption,
    fournisseur,
    num_fournisseur,
  } = req.body;

  try {
    // Vérifier si le médicament existe déjà
    db.query(
      `SELECT * FROM medicaments WHERE nom = ? AND forme = ? AND dosage = ?`,
      [nom, forme, dosage],
      async (err, results) => {
        if (err) {
          console.error(
            "Erreur lors de la vérification du médicament existant",
            err
          );
          return res
            .status(500)
            .send("Erreur lors de la vérification du médicament.");
        }

        if (results.length > 0) {
          // Si le médicament existe déjà, on met à jour le stock
          const idMedicament = results[0].id_medicament;

          // Mise à jour dans la table `stock_medicaments`
          db.query(
            `UPDATE stock_medicaments 
                       SET stock_courant = ?, prix_achat = ?, prix_unitaire = ?, date_achat = ?, date_peremption = ?
                       WHERE id_medicament = ?`,
            [
              stock_courant,
              prix_achat,
              prix_unitaire,
              date_achat,
              date_peremption,
              idMedicament,
            ],
            (err, updateResult) => {
              if (err) {
                console.error("Erreur lors de la mise à jour du stock", err);
                return res
                  .status(500)
                  .send("Erreur lors de la mise à jour du stock.");
              }

              // Insertion dans l'historique des achats
              db.query(
                `INSERT INTO historique_achats (id_medicament, quantite, prix_achat, date_achat, fournisseur, num_fournisseur) 
                               VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  idMedicament,
                  stock_courant,
                  prix_achat,
                  date_achat,
                  fournisseur,
                  num_fournisseur,
                ],
                (err, insertResult) => {
                  if (err) {
                    console.error(
                      "Erreur lors de l'insertion dans l'historique des achats",
                      err
                    );
                    return res
                      .status(500)
                      .send(
                        "Erreur lors de l'insertion dans l'historique des achats."
                      );
                  }

                  return res
                    .status(200)
                    .send(
                      "Médicament mis à jour avec succès et historique enregistré."
                    );
                }
              );
            }
          );
        } else {
          // Sinon, on insère un nouveau médicament
          db.query(
            `INSERT INTO medicaments (nom, forme, dosage, posologie) 
                      VALUES (?, ?, ?, ?)`,
            [nom, forme, dosage, posologie],
            (err, medicamentsResult) => {
              if (err) {
                console.error("Erreur lors de l'ajout du médicament", err);
                return res
                  .status(500)
                  .send("Erreur lors de l'ajout du médicament.");
              }

              const idMedicament = medicamentsResult.insertId;

              db.query(
                `INSERT INTO stock_medicaments (id_medicament, stock_courant, prix_achat, prix_unitaire, date_achat, date_peremption) 
                              VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  idMedicament,
                  stock_courant,
                  prix_achat,
                  prix_unitaire,
                  date_achat,
                  date_peremption,
                ],
                (err, insertStockResult) => {
                  if (err) {
                    console.error("Erreur lors de l'ajout du stock", err);
                    return res
                      .status(500)
                      .send("Erreur lors de l'ajout du stock.");
                  }

                  // Insertion dans l'historique des achats
                  db.query(
                    `INSERT INTO historique_achats (id_medicament, quantite, prix_achat, date_achat, fournisseur, num_fournisseur) 
                                       VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                      idMedicament,
                      stock_courant,
                      prix_achat,
                      date_achat,
                      fournisseur,
                      num_fournisseur,
                    ],
                    (err, insertHistoryResult) => {
                      if (err) {
                        console.error(
                          "Erreur lors de l'insertion dans l'historique des achats",
                          err
                        );
                        return res
                          .status(500)
                          .send(
                            "Erreur lors de l'insertion dans l'historique des achats."
                          );
                      }

                      return res
                        .status(200)
                        .send(
                          "Médicament ajouté avec succès et historique enregistré."
                        );
                    }
                  );
                }
              );
            }
          );
        }
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'ajout du médicament.");
  }
});

app.post("/ajouter-medicament", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;

  let {
    nom,
    forme,
    dosage,
    posologie,
    stock_courant,
    prix_unitaire,
    date_peremption,
    prix_achat,
    date_achat,
    fournisseur,
    num_fournisseur,
  } = req.body;

  // Convertir les champs texte en minuscules
  nom = nom.toLowerCase();
  forme = forme.toLowerCase();
  dosage = dosage.toLowerCase();
  posologie = posologie.toLowerCase();
  fournisseur = fournisseur.toLowerCase();

  // Étape 1 : Vérifier si le médicament existe dans "médicaments"
  const checkMedicamentQuery = `SELECT id_medicament FROM medicaments WHERE id_clinique = ? AND nom = ? AND forme = ? AND dosage = ?`;
  const checkValues = [idClinique, nom, forme, dosage]; // Ajout de idClinique dans la condition

  db.query(checkMedicamentQuery, checkValues, (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification du médicament:", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la vérification du médicament" });
    }

    let id_medicament;

    if (results.length > 0) {
      // Si le médicament existe, récupérer son id
      id_medicament = results[0].id_medicament;
      checkAndUpdateStock(id_medicament);
    } else {
      // Sinon, insérer dans la table "médicaments" et récupérer l'id_medicament
      const insertMedicamentQuery = `INSERT INTO medicaments (nom, forme, dosage, posologie, id_clinique) VALUES (?, ?, ?, ?, ?)`;
      db.query(
        insertMedicamentQuery,
        [nom, forme, dosage, posologie, idClinique],
        (err, insertResult) => {
          if (err) {
            console.error("Erreur lors de l'insertion du médicament:", err);
            return res
              .status(500)
              .json({ message: "Erreur lors de l'insertion du médicament" });
          }

          id_medicament = insertResult.insertId;
          checkAndUpdateStock(id_medicament);
        }
      );
    }
  });

  // Étape 2 : Vérifier ou mettre à jour le stock dans "stock_medicament"
  function checkAndUpdateStock(id_medicament) {
    const checkStockQuery = `SELECT * FROM stock_medicaments WHERE id_clinique = ? AND id_medicament = ?`; // Utilisation de id_medicament pour la vérification
    const checkStockValues = [idClinique, id_medicament];

    db.query(checkStockQuery, checkStockValues, (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification du stock:", err);
        return res
          .status(500)
          .json({ message: "Erreur lors de la vérification du stock" });
      }

      if (results.length > 0) {
        // Si le médicament existe déjà dans le stock, mettre à jour les champs
        const updateStockQuery = `
          UPDATE stock_medicaments
          SET stock_courant = stock_courant + ?, posologie = ?, prix_unitaire = ?, date_peremption = ?, prix_achat = ?, date_achat = ?
          WHERE id_clinique = ? AND id_medicament = ?`; // Mise à jour par id_medicament
        const updateValues = [
          stock_courant,
          posologie,
          prix_unitaire,
          date_peremption,
          prix_achat,
          date_achat,
          idClinique,
          id_medicament,
        ];

        db.query(updateStockQuery, updateValues, (err, result) => {
          if (err) {
            console.error("Erreur lors de la mise à jour du stock:", err);
            return res
              .status(500)
              .json({ message: "Erreur lors de la mise à jour du stock" });
          }

          // Enregistrer l'opération dans historique_achats
          logToHistorique(id_medicament);

          res
            .status(200)
            .json({ message: "Médicament et stock mis à jour avec succès" });
        });
      } else {
        // Sinon, insérer dans "stock_medicaments"
        const insertStockQuery = `
          INSERT INTO stock_medicaments 
          (id_medicament, nom, forme, dosage, posologie, stock_courant, prix_unitaire, date_peremption, prix_achat, date_achat, id_clinique) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertValues = [
          id_medicament,
          nom,
          forme,
          dosage,
          posologie,
          stock_courant,
          prix_unitaire,
          date_peremption,
          prix_achat,
          date_achat,
          idClinique,
        ];

        db.query(insertStockQuery, insertValues, (err, result) => {
          if (err) {
            console.error(
              "Erreur lors de l'insertion dans stock_medicament:",
              err
            );
            return res.status(500).json({
              message: "Erreur lors de l'insertion dans stock_medicament",
            });
          }

          // Enregistrer l'opération dans historique_achats
          logToHistorique(id_medicament);

          res
            .status(200)
            .json({ message: "Médicament ajouté avec succès dans le stock" });
        });
      }
    });
  }

  // Étape 3 : Enregistrer dans "historique_achats"
  function logToHistorique(id_medicament) {
    const insertHistoriqueQuery = `
      INSERT INTO historique_achats 
      (id_medicament, prix_achat, date_achat, quantite, fournisseur, num_fournisseur, id_clinique) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const insertHistoriqueValues = [
      id_medicament,
      prix_achat,
      date_achat,
      stock_courant,
      fournisseur,
      num_fournisseur,
      idClinique,
    ];
    db.query(insertHistoriqueQuery, insertHistoriqueValues, (err, result) => {
      if (err) {
        console.error(
          "Erreur lors de l'enregistrement dans historique_achats:",
          err
        );
      } else {
        console.log("Enregistrement effectué dans historique_achats.");
      }
    });
  }
});

app.post("/effectuer-vente", verifyToken, async (req, res) => {
  const medicaments = req.body.medicaments; // Assurez-vous que les médicaments sont dans cette clé
  const code_admin = req.body.code_admin; // Récupérer code_admin du formulaire
  const mode_paiement = req.body.mode_paiement; // Récupérer mode_paiement du formulaire
  const idClinique = req.user.idClinique;

  // 1. Vérification des données reçues
  if (!medicaments || medicaments.length === 0) {
    return res.status(400).json({ message: "Aucun médicament fourni." });
  }

  if (
    !code_admin ||
    typeof code_admin !== "string" ||
    code_admin.trim() === ""
  ) {
    return res
      .status(400)
      .json({ message: "Le code administrateur est requis." });
  }

  if (!mode_paiement) {
    return res.status(400).json({ message: "Le mode de paiement est requis." });
  }

  // 2. Vérifier que le code_admin existe dans la base de données
  const getAdminsQuery =
    "SELECT id_admin_clinique, code_admin FROM administration WHERE id_clinique = ?";
  db.query(getAdminsQuery, idClinique, (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des administrateurs :",
        err
      );
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }

    let foundAdmin = null;
    for (const admin of results) {
      if (
        admin.code_admin &&
        bcrypt.compareSync(code_admin, admin.code_admin)
      ) {
        foundAdmin = admin;
        break;
      }
    }

    if (!foundAdmin) {
      console.error("Code administrateur incorrect");
      return res.status(401).json({ error: "Code administrateur incorrect" });
    }

    console.log("Administrateur validé :", foundAdmin.id_admin);

    // 3. Vérification si medicaments est un tableau
    if (!Array.isArray(medicaments)) {
      return res.status(400).json({
        message: "Les médicaments doivent être envoyés sous forme de tableau.",
      });
    }

    // 4. Filtrer les médicaments valides
    const medicamentsValides = medicaments.filter((med) => med.id_medicament);
    if (medicamentsValides.length === 0) {
      return res.status(400).json({
        message: "Aucun médicament valide fourni (id_medicament manquant).",
      });
    }

    // 5. Calcul du montant total global pour la vente
    const montant_total = medicamentsValides.reduce((sum, med) => {
      const montant = (med.quantite_vendue || 0) * (med.prix_unitaire || 0);
      return sum + montant;
    }, 0);

    console.log("Montant total de la vente :", montant_total);

    // 6. Début de transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Erreur début de transaction :", err);
        return res
          .status(500)
          .json({ message: "Erreur de transaction.", error: err });
      }

      // 7. Insertion dans la table vente avec mode_paiement
      const venteQuery =
        "INSERT INTO vente (montant_total, code_admin, mode_paiement, id_clinique) VALUES (?, ?, ?, ?)";
      db.query(
        venteQuery,
        [montant_total, foundAdmin.code_admin, mode_paiement, idClinique],
        (err, result) => {
          if (err) {
            console.error("Erreur insertion vente :", err);
            return db.rollback(() => {
              res.status(500).json({
                message: "Erreur lors de l'insertion de la vente.",
                error: err,
              });
            });
          }

          const id_vente = result.insertId; // Récupération de l'ID de vente
          console.log("ID de la vente :", id_vente);

          // 8. Préparation des valeurs pour detaille_vente
          const detailleValues = medicamentsValides.map((med) => {
            if (!med.nom || !med.forme || !med.dosage) {
              throw new Error(
                `Les informations du médicament (nom, forme, dosage) sont incomplètes.`
              );
            }
            return [
              id_vente,
              med.id_medicament,
              med.nom,
              med.forme,
              med.dosage,
              med.quantite_vendue,
              med.prix_unitaire || 0, // Par défaut 0 si prix manquant
              idClinique,
            ];
          });

          const detailleQuery = `
            INSERT INTO detaille_vente 
            (id_vente, id_medicament, nom, forme, dosage, quantite_vendue, prix_unitaire, id_clinique)
            VALUES ?
          `;

          // 9. Insertion des détails de vente
          db.query(detailleQuery, [detailleValues, idClinique], (err) => {
            if (err) {
              console.error("Erreur insertion détails de vente :", err);
              return db.rollback(() => {
                res.status(500).json({
                  message:
                    "Erreur lors de l'insertion des détails de la vente.",
                  error: err,
                });
              });
            }

            // 10. Mise à jour des stocks
            const stockUpdates = medicamentsValides.map((med) => {
              return new Promise((resolve, reject) => {
                const stockQuery = `
                  UPDATE stock_medicaments 
                  SET stock_courant = stock_courant - ?
                  WHERE id_clinique = ? AND id_medicament = ? AND stock_courant >= ?
                `;
                db.query(
                  stockQuery,
                  [
                    med.quantite_vendue,
                    idClinique,
                    med.id_medicament,
                    med.quantite_vendue,
                  ],
                  (err, result) => {
                    if (err || result.affectedRows === 0) {
                      console.error(
                        "Erreur mise à jour stock ou stock insuffisant :",
                        med.nom
                      );
                      return reject(
                        new Error(
                          `Stock insuffisant pour le médicament : ${med.nom}`
                        )
                      );
                    }
                    resolve();
                  }
                );
              });
            });

            // Attendre que toutes les mises à jour des stocks soient terminées
            Promise.all(stockUpdates)
            .then(() => {
              db.commit((err) => {
                if (err) {
                  console.error("Erreur validation de la transaction :", err);
                  return db.rollback(() => {
                    res.status(500).json({
                      message: "Erreur validation transaction.",
                      error: err,
                    });
                  });
                }
          
                // Requête pour récupérer les infos de la clinique
                const getCliniqueQuery = "SELECT nom, adresse, telephone FROM cliniques WHERE id_clinique = ?";
                db.query(getCliniqueQuery, [idClinique], (err, cliniqueResults) => {
                  if (err || cliniqueResults.length === 0) {
                    console.error("Erreur récupération clinique :", err);
                    return res.status(500).json({ message: "Erreur récupération clinique." });
                  }
          
                  const { nom, adresse, telephone } = cliniqueResults[0];
          
                  // Génération des détails pour la facture
                  const itemsHtml = medicaments
                    .map((med) => {
                      return `
                        <tr>
                          <td>${med.nom}</td>
                          <td>${med.forme}</td>
                          <td>${med.dosage}</td>
                          <td>${med.quantite_vendue}</td>
                          <td>${med.prix_unitaire} FCFA</td>
                          <td>${med.quantite_vendue * (med.prix_unitaire || 0)} FCFA</td>
                        </tr>
                      `;
                    })
                    .join("");
          
                  // Chargement du modèle HTML
                  fs.readFile(path.join(__dirname, "public", "pharmacie.html"), "utf8", (err, templateHtml) => {
                    if (err) {
                      console.error("Erreur lors de la lecture du modèle HTML :", err);
                      return res.status(500).json({
                        message: "Erreur de lecture du modèle de facture.",
                      });
                    }
          
                    // Remplacement des variables dans le modèle HTML
                    const finalHtml = templateHtml
                      .replace("{{imgHtml}}", logoBase64)
                      .replace("{{itemsHtml}}", itemsHtml)
                      .replace("{{montant_total}}", montant_total)
                      .replace("{{nom_clinique}}", nom)
                      .replace("{{adresse_clinique}}", adresse)
                      .replace("{{telephone_clinique}}", telephone);
          
                    // Génération du PDF avec Puppeteer
                    (async () => {
                      const browser = await puppeteer.launch();
                      const page = await browser.newPage();
                      await page.setContent(finalHtml);
                      const pdfPath = path.join(downloadsPath, `facture_${id_vente}.pdf`);
                      await page.pdf({ path: pdfPath, format: "A5" });
          
                      await browser.close();
                      console.log("Facture générée avec succès !");
          
                      // Retourner la réponse
                      res.status(200).json({
                        message: "Vente effectuée avec succès et facture générée.",
                        pdfPath: pdfPath,
                      });
                    })();
                  });
                });
              });
            })
            .catch((error) => {
              db.rollback(() => {
                console.error("Erreur lors de la mise à jour du stock :", error.message);
                res.status(400).json({ message: error.message });
              });
            });
          
          });
        }
      );
    });
  });
});

app.get("/medicaments", verifyToken, (req, res) => {
  const { nom, forme, dosage } = req.query;
  const idClinique = req.user.idClinique;

  let query = `
      SELECT sm.id_stock, sm.id_medicament, m.nom, m.forme, m.dosage, sm.prix_unitaire, sm.stock_courant, sm.date_peremption
      FROM stock_medicaments sm
      JOIN medicaments m ON sm.id_medicament = m.id_medicament
      WHERE sm.id_clinique = ? 
  `;
  const params = [idClinique]; // ✅ On commence par idClinique

  if (nom) {
    query += " AND m.nom = ?";
    params.push(nom);
  }

  if (forme) {
    query += " AND m.forme = ?";
    params.push(forme);
  }

  if (dosage) {
    query += " AND m.dosage = ?";
    params.push(dosage);
  }

  // ✅ Correction ici (ordre des paramètres)
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Erreur SQL :", err);
      res.status(500).send("Erreur serveur");
    } else {
      console.log("✅ Résultats trouvés :", results);
      res.json(results);
    }
  });
});

app.get("/vente", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  // La requête SQL pour récupérer les informations de la table détaille_vente et le mode_paiement de la table vente
  const query = `
    SELECT dv.id_vente, dv.id_vente_detail, dv.nom, dv.forme, dv.dosage, dv.quantite_vendue, dv.prix_unitaire, 
           (dv.quantite_vendue * dv.prix_unitaire) AS montant_vente, v.mode_paiement
    FROM detaille_vente dv
    INNER JOIN vente v ON dv.id_vente = v.id_vente 
    WHERE dv.id_clinique = ?
  `;

  // Exécution de la requête SQL
  db.query(query, idClinique, (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des données de la vente:",
        err
      );
      return res.status(500).send("Erreur interne du serveur");
    }

    // Envoi des résultats au client
    res.json(results);
  });
});

app.get("/ventes", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;

  const query = `SELECT * FROM vente WHERE id_clinique = ?`;
  db.query(query, idClinique, (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des données de la vente:",
        err
      );
      return res.status(500).send("Erreur interne du serveur");
    }
    console.log("Résultats des ventes :", results);
    res.json(results);
  });
});

// Route pour récupérer les informations d'un médicament, y compris le prix unitaire
app.get("/medicament", verifyToken, (req, res) => {
  const { nom, forme, dosage } = req.query;
  const idClinique = req.user.idClinique;

  // Vérifier que tous les paramètres sont fournis
  if (!nom || !forme || !dosage) {
    return res.status(400).json({
      error: "Les paramètres nom, forme et dosage sont obligatoires.",
    });
  }

  const sql = `
    SELECT 
      m.id_medicament, 
      sm.prix_unitaire
    FROM 
      medicaments AS m
    JOIN 
      stock_medicaments AS sm 
    ON 
      m.id_medicament = sm.id_medicament
    WHERE 
      m.id_clinique = ? AND m.nom = ? AND m.forme = ? AND m.dosage = ?
  `;

  db.query(sql, [idClinique, nom, forme, dosage], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des informations du médicament :",
        err
      );
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Médicament introuvable" });
    }

    res.json(results[0]); // On retourne uniquement le premier résultat s'il y en a plusieurs
  });
});

app.get("/medicaments/search", verifyToken, (req, res) => {
  console.log("Utilisateur authentifié :", req.user);
  const idClinique = req.user.idClinique;
  const { name } = req.query;
  const query = `%${name}%`;
  const sql =
    "SELECT DISTINCT nom FROM medicaments WHERE id_clinique = ? AND nom LIKE ?";

  db.query(sql, [idClinique, query], (err, results) => {
    if (err) {
      console.error(
        "Erreur lors de la récupération des noms de médicaments :",
        err
      );
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des formes :", results); // Débogage
    res.json(results.map((row) => ({ nom: row.nom }))); // Changez ici pour renvoyer un tableau simple
  });
});

// Route pour récupérer les formes des médicaments
app.get("/formes/search", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const { name } = req.query;
  const query = `%${name}%`;
  const sql =
    "SELECT DISTINCT forme FROM medicaments WHERE id_clinique = ? AND forme LIKE ?";

  db.query(sql, [idClinique, query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des formes :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des formes :", results); // Débogage
    res.json(results.map((row) => ({ forme: row.forme })));
  });
});

// Route pour récupérer les dosages des médicaments
app.get("/dosages/search", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const { name } = req.query;
  const query = `%${name}%`;
  const sql =
    "SELECT DISTINCT dosage FROM medicaments WHERE id_clinique = ? AND dosage LIKE ?";

  db.query(sql, [idClinique, query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des dosages :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des dosages :", results); // Débogage
    res.json(results.map((row) => ({ dosage: row.dosage })));
  });
});

app.get("/posologies/search", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  const { name } = req.query;
  const query = `%${name}`;
  const sql =
    "SELECT DISTINCT posologie FROM medicaments WHERE id_clinique = ? AND posologie LIKE ?";

  db.query(sql, [query, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des posologies :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des posologies :", results); // Débogage
    res.json(results.map((row) => ({ posologie: row.posologie })));
  });
});

{
  /* FIN Pharmacie*/
}

{
  /* DEBUT Soins*/
}

// Route POST pour insérer un soin
app.post("/soins", verifyToken, (req, res) => {
  const { type_soin, prix, departement } = req.body;
  const idClinique = req.user.idClinique;

  // **1. Validation des données**
  if (!type_soin || !prix || !departement) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  if (isNaN(prix)) {
    return res
      .status(400)
      .json({ message: "Le prix doit être un nombre valide." });
  }

  // **2. Vérification si le département existe dans la table departments**
  const checkDepartementQuery =
    "SELECT id_departement FROM departements WHERE id_clinique = ? AND departement = ? LIMIT 1"; // On recherche le département

  db.query(checkDepartementQuery, [idClinique, departement], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification du département : ", err);
      return res.status(500).json({
        message: "Erreur serveur lors de la vérification du département.",
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        message:
          "Le département spécifié n'existe pas dans la table departments.",
      });
    }

    const id_departement = results[0].id_departement; // On récupère l'id_departement

    // **3. Vérification si le type de soin existe déjà dans la table soins**
    const checkSoinQuery =
      "SELECT 1 FROM soins WHERE id_clinique = ? AND type_soin = ? LIMIT 1";

    db.query(checkSoinQuery, [idClinique, type_soin], (err, results) => {
      if (err) {
        console.error("Erreur lors de la vérification du soin : ", err);
        return res.status(500).json({
          message: "Erreur serveur lors de la vérification du soin.",
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          message: "Le soin existe déjà dans la base de données.",
        });
      }

      // **4. Insertion dans la table soins avec l'id_departement**
      const insertSoinsQuery =
        "INSERT INTO soins (type_soin, prix, id_departement, id_clinique) VALUES (?, ?, ?, ?)"; // Utilisation de id_departement

      db.query(
        insertSoinsQuery,
        [type_soin, prix, id_departement, idClinique], // On insère id_departement au lieu de departement
        (err, results) => {
          if (err) {
            console.error("Erreur lors de l'insertion des soins : ", err);
            return res.status(500).json({
              message: "Erreur serveur lors de l'insertion des soins.",
            });
          }

          return res.status(201).json({
            message: "Soins ajoutés avec succès",
            soinsId: results.insertId,
          });
        }
      );
    });
  });
});

// API pour récupérer les soins
app.get("/soins/:type_soin", verifyToken, (req, res) => {
  const { type_soin } = req.params;
  const idClinique = req.user.idClinique;

  const checkSoinQuery =
    "SELECT 1 FROM soins WHERE id_clinique = ? AND type_soin = ? LIMIT 1";

  db.query(checkSoinQuery, [type_soin, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la vérification du soin : ", err);
      return res.status(500).json({
        message: "Erreur serveur lors de la vérification du soin.",
      });
    }

    const exists = results.length > 0;
    res.json({ exists });
  });
});

app.get("/soins", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  // Requête SQL pour récupérer toutes les informations de la table soins sauf id_soin, et le nom du département
  const query = `
    SELECT s.id_soin, s.type_soin, s.prix, d.departement AS departement
    FROM soins s
    JOIN departements d ON s.id_departement = d.id_departement
    WHERE s.id_clinique = ?
  `;

  db.query(query, [idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des soins : ", err);
      return res.status(500).json({
        message: "Erreur serveur lors de la récupération des soins.",
      });
    }

    return res.status(200).json({
      message: "Soins récupérés avec succès.",
      soins: results,
    });
  });
});

app.delete("/delete_soins/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM soins WHERE id_soin=?";
  const values = [id];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({ message: "Something unexpected has occured" + err });
    return res.json({ success: "Student updated successfully" });
  });
});

{
  /* FIN Soins*/
}

{
  /* DEBUT Charges*/
}

// Route pour ajouter une charge

app.post(
  "/ajouter-charge",
  verifyToken,
  upload.single("fichie_joint"),
  (req, res) => {
    const {
      charge,
      montant,
      description,
      date,
      type_charge,
      type_caisse,
      provenance,
    } = req.body;
    const fichie_joint = req.file ? `/images/${req.file.filename}` : null;

    // Récupération de l'id de la clinique depuis le token
    const id_clinique = req.user.idClinique;

    if (!charge || !montant || !date) {
      return res.status(400).json({
        error:
          "Veuillez fournir les champs obligatoires : charge, montant, et date.",
      });
    }

    // Ajout de id_clinique dans la requête SQL
    const query = `INSERT INTO comptabilite (charge, montant, description, date, type_charge, type_caisse, provenance, fichie_joint, id_clinique) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      query,
      [
        charge,
        montant,
        description || null,
        date,
        type_charge,
        type_caisse,
        provenance,
        fichie_joint,
        id_clinique, // Ajout de id_clinique
      ],
      (err, result) => {
        if (err) {
          console.error("Erreur lors de l'insertion des données :", err);
          return res
            .status(500)
            .json({ error: "Erreur serveur. " + err.message });
        }

        // Réponse de succès avec les données pertinentes
        res.status(201).json({
          message: "Entrée ajoutée avec succès.",
          id: result.insertId,
          id_clinique: id_clinique,
          fichie_joint: fichie_joint,
        });
      }
    );
  }
);

app.get("/consultations/:year/:month", verifyToken, (req, res) => {
  const { year, month } = req.params;
  const idClinique = req.user.idClinique;

  // Requête pour obtenir toutes les consultations du mois et de l'année spécifiés
  const query = `
      SELECT id, date, montant, type_soin
      FROM consultation
      WHERE id_clinique = ? AND YEAR(date) = ? AND MONTH(date) = ?
      ORDER BY date ASC
  `;

  db.query(query, [idClinique, year, month], (err, results) => {
    if (err) {
      console.error("Erreur lors de la requête SQL :", err);
      return res
        .status(500)
        .send("Erreur lors de la récupération des consultations");
    }

    // Vous pouvez envoyer toutes les consultations ici
    res.json({ consultations: results });
  });
});

app.get("/ventes/:year/:month", verifyToken, (req, res) => {
  const { year, month } = req.params;
  const idClinique = req.user.idClinique;

  const query = `
      SELECT  
      id_vente,
          montant_total, 
          date 
      FROM vente 
      WHERE id_clinique = ? AND YEAR(date) = ? AND MONTH(date) = ?
      ORDER BY date ASC
  `;

  db.query(query, [idClinique, year, month], (err, results) => {
    if (err) {
      console.error("Erreur lors de la requête SQL :", err);
      return res.status(500).send("Erreur lors de la récupération des ventes");
    }

    res.json(results); // Envoie toutes les ventes sous forme de tableau
  });
});

// Route pour récupérer toutes les entrées ou une entrée spécifique
app.get("/charges/:year/:month", verifyToken, (req, res) => {
  const { year, month } = req.params;
  const idClinique = req.user.idClinique;

  // Construction de la requête SQL avec filtrage par année et mois
  const sql = `
    SELECT * 
    FROM comptabilite
    WHERE id_clinique = ? AND YEAR(date) = ? AND MONTH(date) = ?
  `;

  db.query(sql, [idClinique, year, month], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    console.log("Résultats de la requête : ", result); // Log des résultats
    res.json(result); // Renvoie les résultats sous forme de JSON
  });
});

// Route pour télécharger un fichier spécifique
app.get("/telecharger/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(imgDir, filename); // Utilise le bon chemin pour trouver les fichiers

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Erreur lors du téléchargement du fichier :", err);
        res.status(500).send("Erreur serveur.");
      }
    });
  } else {
    res.status(404).send("Fichier non trouvé.");
  }
});

// Route pour récupérer le total des achats et la dernière date du mois
app.get("/historique_achats/:year/:month", verifyToken, (req, res) => {
  const { year, month } = req.params;
  const idClinique = req.user.idClinique;

  const query = `
      SELECT
          h.id_achat,
          m.nom AS nom_medicament,
          h.date_achat,
          h.quantite,
          h.prix_achat,
          (h.quantite * h.prix_achat) AS total_achat
      FROM
          historique_achats h
      JOIN
          medicaments m ON h.id_medicament = m.id_medicament
      WHERE
          h.id_clinique = ? AND YEAR(h.date_achat) = ? AND MONTH(h.date_achat) = ?
  `;

  db.query(query, [idClinique, year, month], (err, results) => {
    if (err) {
      console.error("Erreur lors de l'exécution de la requête:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    console.log("Résultats de la requête : ", results); // Log des résultats
    res.json(results);
  });
});

app.delete("/delete_charge/:id", (req, res) => {
  const id = req.params.id; // Récupérer l'ID de la charge à supprimer

  // Effectuer la suppression uniquement si l'ID correspond à une charge dans la table 'comptabilite'
  const sql = "DELETE FROM comptabilite WHERE id = ? AND charge IS NOT NULL"; // S'assurer que c'est une charge
  const values = [id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erreur lors de la suppression :", err);
      return res
        .status(500)
        .json({ message: "Une erreur s'est produite lors de la suppression" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Charge non trouvée" });
    }
    return res.json({ success: "Charge supprimée avec succès" });
  });
});

// Route pour récupérer le total des paiements par mois et année
app.get("/paiements/:year/:month", verifyToken, async (req, res) => {
  const { year, month } = req.params;
  const idClinique = req.user.idClinique;

  try {
    db.query(
      `SELECT 
         p.id_paiement,
         p.date_paiement,
         s.salaire_brute,
         p.prime,
         p.sur_salaire,
         (s.salaire_brute + p.prime + p.sur_salaire) AS montant_total
       FROM paiement p
       JOIN salaire s ON p.id_salaire = s.id_salaire
       WHERE p.id_clinique = ? AND MONTH(p.date_paiement) = ? AND YEAR(p.date_paiement) = ?`,
      [idClinique, month, year],
      (error, results) => {
        if (error) {
          console.error("Erreur lors de l’exécution de la requête :", error);
          res.status(500).send("Erreur serveur");
          return;
        }

        res.json(results); // Retourner tous les paiements
      }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error);
    res.status(500).send("Erreur serveur");
  }
});

{
  /* FIN Charges*/
}

// Route pour rechercher les départements
app.get("/departements/search", verifyToken, (req, res) => {
  console.log("✅ ID de la clinique extrait du token :", req.user.idClinique);

  const { name } = req.query;
  const idClinique = req.user.idClinique; // Récupérer l'ID de la clinique depuis l'utilisateur connecté

  if (!idClinique) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const query = `%${name}%`;
  const sql = `
    SELECT DISTINCT departement 
    FROM departements 
    WHERE departement LIKE ? 
    AND id_clinique = ?`; // Ajout du filtre par clinique

  db.query(sql, [query, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des départements :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des départements :", results); // Débogage
    res.json(results.map((row) => ({ departement: row.departement })));
  });
});

app.get("/departements", verifyToken, (req, res) => {
  console.log("✅ ID de la clinique extrait du token :", req.user.idClinique);

  const idClinique = req.user.idClinique; // Récupérer l'ID de la clinique depuis l'utilisateur connecté

  if (!idClinique) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const sql = `
    SELECT DISTINCT departement 
    FROM departements 
    WHERE id_clinique = ?`; // Ajout du filtre par clinique

  db.query(sql, [idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des départements :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des départements :", results); // Débogage
    res.json(results.map((row) => ({ departement: row.departement })));
  });
});

app.get("/postes/search", verifyToken, (req, res) => {
  const { name } = req.query;
  const idClinique = req.user.idClinique;

  if (!idClinique) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  const query = `%${name}%`;
  const sql =
    "SELECT DISTINCT poste FROM departements WHERE poste LIKE ? AND id_clinique = ?";

  db.query(sql, [query, idClinique], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des postes :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des dosages :", results); // Débogage
    res.json(results.map((row) => ({ poste: row.poste })));
  });
});

// Routes pour le labo

app.post("/add_labo", verifyToken, (req, res) => {
  const {
    nom,
    prenom,
    age,
    sexe,
    telephone,
    ethnie,
    localite,
    type_soin,
    nature,
    resultat,
    renseignement,
    id_admin_clinique,
  } = req.body;
  const idClinique = req.user.idClinique;

  // Étape 1 : Récupérer le prix depuis la table soins
  const getPrixQuery =
    "SELECT prix FROM soins WHERE type_soin = ? AND id_clinique = ?";
  db.query(getPrixQuery, [type_soin, idClinique], (err, result) => {
    if (err)
      return handleError(
        err,
        res,
        "Erreur lors de la récupération du montant."
      );
    if (result.length === 0)
      return res.status(404).json({ error: "Type de soin introuvable." });

    const montant = result[0].prix;

    // Étape 2 : Insérer la consultation
    const insertConsultationQuery = `
      INSERT INTO laboratoire (nom, prenom, age, sexe, telephone, ethnie, localite,
        type_soin, nature, resultat, renseignement, montant, id_admin_clinique, id_clinique)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const consultationValues = [
      nom,
      prenom,
      age,
      sexe,
      telephone,
      ethnie,
      localite,
      type_soin,
      nature,
      resultat,
      renseignement,
      montant,
      id_admin_clinique,
      idClinique,
    ];

    db.query(insertConsultationQuery, consultationValues, (insertErr) => {
      if (insertErr)
        return handleError(
          insertErr,
          res,
          "Erreur lors de l'ajout de la consultation."
        );

      // Mise à jour du nombre de consultations pour le médecin
      updateMedecinConsultations(id_admin_clinique);

      // Générer les détails de la facture
      const itemsHtml = `
        <tr>
          <td>${nature}</td>
          <td>${resultat}</td>
          <td>${renseignement}</td>
        </tr>
      `;

      const getCliniqueQuery =
        "SELECT nom, adresse, telephone FROM cliniques WHERE id_clinique = ?";

      db.query(getCliniqueQuery, [idClinique], (err, cliniqueResults) => {
        if (err || cliniqueResults.length === 0) {
          console.error(
            "Erreur lors de la récupération des infos de la clinique :",
            err
          );
          return handleError(
            err,
            res,
            "Erreur lors de la récupération des infos de la clinique"
          );
        }

        const { nom, adresse, telephone } = cliniqueResults[0];
        // Charger et remplacer le modèle HTML
        generateInvoiceHtml(
          itemsHtml,
          nom,
          prenom,
          sexe,
          age,
          localite,
          ethnie,
          nom,
          adresse,
          telephone,
          res
        );
      });
    });
  });
});

function handleError(err, res, message) {
  console.error(message, err);
  res.status(500).json({ error: message });
}

function updateMedecinConsultations(id_admin_clinique) {
  const updateMedecinQuery =
    "UPDATE administration SET nombre_consultation = nombre_consultation + 1 WHERE id_admin_clinique = ?";
  db.query(updateMedecinQuery, [id_admin_clinique], (updateErr) => {
    if (updateErr)
      console.error("Erreur lors de la mise à jour du médecin :", updateErr);
  });
}

function generateInvoiceHtml(
  itemsHtml,
  nom,
  prenom,
  sexe,
  age,
  localite,
  ethnie,
  nom_clinique,
  adresse_clinique,
  telephone_clinique,
  res
) {
  fs.readFile(
    path.join(__dirname, "public", "labo.html"),
    "utf8",
    (err, templateHtml) => {
      if (err)
        return handleError(err, res, "Erreur de lecture du modèle de facture.");
      const finalHtml = templateHtml
        .replace("{{imgHtml}}", logoBase64)
        .replace("{{itemsHtml}}", itemsHtml)
        .replace("{{nom}}", nom)
        .replace("{{prenom}}", prenom)
        .replace("{{sexe}}", sexe)
        .replace("{{age}}", age)
        .replace("{{localite}}", localite)
        .replace("{{ethnie}}", ethnie)
        .replace("{{nom_clinique}}", nom_clinique)
        .replace("{{adresse_clinique}}", adresse_clinique)
        .replace("{{telephone_clinique}}", telephone_clinique);

      generatePdfFromHtml(finalHtml, res);
    }
  );
}

async function generatePdfFromHtml(htmlContent, res) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);

  const pdfPath = path.join(downloadsPath, `examen_${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: "A5" });

  await browser.close();
  console.log("Facture générée avec succès !");

  res.status(200).json({
    message: "Vente effectuée avec succès et facture générée.",
    pdfPath: pdfPath,
  });
}

function getLaboByDep(poste, idClinique, res) {
  const sql = `
    SELECT 
      l.*
  FROM 
  laboratoire l
    JOIN 
      administration a ON l.id_admin_clinique = a.id_admin_clinique
    JOIN 
      departements d ON a.id_departement = d.id_departement
    WHERE 
      d.poste Like ? AND a.id_clinique = ?
  `;

  db.query(sql, [poste, idClinique], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucune consultation trouvée pour ce département" });
    }

    console.log("Résultats de la requête : ", result);
    res.json(result);
  });
}

app.get("/labo/consult", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  getLaboByDep("%Laboratin%", idClinique, res);
});

app.get("/admin/consult", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  getLaboByDep("%Laboratin%", idClinique, res);
});

app.get("/adminc/consult", verifyToken, (req, res) => {
  const idClinique = req.user.idClinique;
  getLaboByDep("%Laboratin%", idClinique, res);
});

// Les recherches dans infirme

app.get("/prenoms/search", (req, res) => {
  const { name } = req.query;
  const query = `%${name}%`;
  const sql = "SELECT DISTINCT prenom FROM patient WHERE prenom LIKE ?";

  db.query(sql, [query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des prenoms :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des prenoms :", results); // Débogage
    res.json(results.map((row) => ({ prenom: row.prenom })));
  });
});

app.get("/noms/search", (req, res) => {
  const { name } = req.query;
  const query = `%${name}%`;
  const sql = "SELECT DISTINCT nom FROM patient WHERE nom LIKE ?";

  db.query(sql, [query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des noms :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des noms :", results); // Débogage
    res.json(results.map((row) => ({ nom: row.nom })));
  });
});

app.get("/localites/search", (req, res) => {
  const { name } = req.query;
  const query = `%${name}%`;
  const sql = "SELECT DISTINCT localite FROM patient WHERE localite LIKE ?";

  db.query(sql, [query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des localites :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des localites :", results); // Débogage
    res.json(results.map((row) => ({ localite: row.localite })));
  });
});

app.get("/ethnies/search", (req, res) => {
  const { name } = req.query;
  const query = `%${name}%`;
  const sql = "SELECT DISTINCT ethnie FROM patient WHERE ethnie LIKE ?";

  db.query(sql, [query], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des ethnies :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    console.log("Résultats des ethnies :", results); // Débogage
    res.json(results.map((row) => ({ ethnie: row.ethnie })));
  });
});

// Servir les fichiers statiques de l'application React après les routes API
app.use(express.static(path.join(__dirname, "build")));

// Route pour gérer toutes les autres requêtes (frontend React)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const server = app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM reçu, arrêt du serveur...");
  server.close(() => {
    console.log("Serveur arrêté proprement.");
    process.exit(0);
  });
});

