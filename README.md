# MediTrack 🩺💊

MediTrack est une application web dédiée à la **gestion des traitements médicaux et de la pharmacie familiale**.

L’objectif du projet est de permettre à plusieurs utilisateurs de suivre leurs médicaments, leurs prises quotidiennes, leurs stocks et leurs dates de péremption à travers une interface simple et intuitive.

Le projet combine :
* une interface front‑end légère en **React**
* une base de données locale de médicaments
* un module OCR expérimental basé sur le machine learning

---

# ✨ Fonctionnalités

## 👥 Gestion des utilisateurs

* Création et sélection de profils utilisateurs
* Couleurs et avatars personnalisés
* Association des traitements par utilisateur

## 💊 Gestion des traitements

* Ajout manuel de médicaments
* Définition :
  * dosage
  * fréquence
  * horaires
  * durée du traitement
* Suivi des prises quotidiennes
* Validation des prises effectuées
* Alertes de fin de traitement

## 📅 Semainier interactif

* Navigation entre les semaines
* Progression quotidienne
* Visualisation des prises :
  * passées
  * présentes
  * futures

## 📸 OCR d’ordonnance (expérimental)

Le projet inclut un module OCR préparé pour :
* analyser une ordonnance médicale
* reconnaître automatiquement les médicaments
* préremplir les traitements

Le dossier `ocr/` contient :
* le notebook d’entraînement
* le tokenizer
* les labels
* le modèle `.keras`

⚠️ Le modèle est actuellement fourni à titre expérimental.

## 🏠 Pharmacie familiale

* Gestion des stocks
* Quantités ajustables
* Gestion des dates de péremption
* Alertes :
  * stock faible
  * médicaments expirés
  * expiration proche

## 🔔 Notifications

* Alertes visuelles
* Notifications de confirmation
* Informations de suivi des traitements

---

# 🛠️ Technologies utilisées

## Front‑end

* HTML5
* CSS3
* JavaScript
* React 18 (CDN)
* Babel Standalone
* Lucide Icons

## OCR / Machine Learning

* Python
* TensorFlow / Keras
* Notebook Jupyter
* Pickle

## Données

* SQLite (`bdpm.db`)

---

# 📁 Structure du projet

```bash
MediTrack/
│
├── data/
│   └── bdpm.db
│
├── ocr/
│   ├── labels.pickle
│   ├── medication_brain.keras
│   ├── ocr.ipynb
│   └── tokenizer.pickle
│
├── pyproject.toml
├── index.html
└── README.md
```

---

# 📂 Description des dossiers

## 📁 data/

Contient les données liées aux médicaments.

### `bdpm.db`

Base de données SQLite utilisée pour stocker les informations médicales et pharmaceutiques.

---

## 📁 ocr/

Contient les fichiers liés à la reconnaissance de texte et au machine learning.

### `ocr.ipynb`

Notebook Jupyter utilisé pour :
* entraîner le modèle OCR
* tester les prédictions
* préparer les données

### `medication_brain.keras`

Modèle entraîné pour la reconnaissance des médicaments.

### `labels.pickle`

Correspondance entre les labels et les prédictions.

### `tokenizer.pickle`

Tokenizer utilisé pour le traitement du texte.

---

## 📄 index.html

Point d’entrée principal de l’application.

Le projet front‑end est volontairement centralisé dans un seul fichier afin de :
* simplifier le prototypage
* faciliter la démonstration
* éviter une phase de build complexe

Le fichier contient :
* l’interface utilisateur
* les composants React
* les styles CSS
* la logique JavaScript

---
## 📄 pyproject.toml

Le fichier pyproject.toml est le fichier de configuration principal du projet Python.

Il permet de :
- définir les dépendances du projet
- gérer les versions Python compatibles
- configurer les outils de développement
- centraliser les métadonnées du projet
- préparer une future industrialisation du projet

Le fichier contient notamment :
- les dépendances TensorFlow / Keras
- la configuration du build Python
- les outils de formatage (black, isort)
- la configuration des tests
- les informations générales du projet

Ce fichier est aujourd’hui le standard moderne de configuration pour les projets Python.

---

# 🚀 Installation et lancement

## 1. Cloner le projet

```bash
git clone <repo-url>
```

## 2. Ouvrir le projet

```bash
cd MediTrack
```

## 3. Lancer l’application

Ouvrir simplement :
```bash
index.html
```

dans un navigateur moderne :
* Chrome
* Firefox
* Edge

✅ Aucun serveur ou build nécessaire.

---

# 🔮 Améliorations futures

* Sauvegarde persistante (LocalStorage / IndexedDB)
* Backend API
* Authentification utilisateur
* Synchronisation cloud
* Notifications push
* OCR intelligent réel
* Export PDF des traitements
* Version mobile PWA
* Tableau de bord statistiques

---

# ⚠️ Avertissement

Ce projet est un prototype pédagogique et démonstratif.

Il ne remplace pas :
* un suivi médical
* un pharmacien
* un avis professionnel de santé

---

# 👨‍💻 Auteur

Projet réalisé dans le cadre d’un prototype UX/UI et d’expérimentations autour :
* du suivi médical
* de la gestion de pharmacie familiale
* de l’intégration OCR
* de l’intelligence artificielle

---

# 💡 Objectif

Simplifier le suivi des traitements médicaux et améliorer l’organisation de la pharmacie familiale grâce à une interface moderne et accessible.
