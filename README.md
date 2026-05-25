# MediTrack 🩺💊

MediTrack est une application web de **gestion de médicaments et de pharmacie familiale**. Elle permet de suivre les traitements, les prises quotidiennes, les dates de fin de traitement, ainsi que l’état de la pharmacie à domicile (stocks, péremption, alertes).

Le projet est conçu comme une **application front‑end autonome**, basée sur **React** via CDN, sans backend.

---

## ✨ Fonctionnalités principales

### 👥 Gestion multi‑utilisateurs

* Sélection d’un utilisateur (ex : parent, enfant, proche)
* Couleur et avatar personnalisés par utilisateur
* Médicaments associés individuellement

### 💊 Suivi des traitements

* Ajout manuel de médicaments
* Définition du dosage, des horaires et de la durée du traitement
* Vue **semainier** avec progression quotidienne
* Validation des prises (case à cocher par horaire)
* Alerte lorsque la fin d’un traitement approche

### 📅 Semainier interactif

* Navigation entre les semaines
* Indicateur de progression par jour
* Visualisation claire des prises passées, présentes et à venir

### 📸 Scan d’ordonnance (OCR – simulation)

* Import d’une image (photo ou fichier)
* Analyse simulée avec barre de progression
* Pré‑remplissage automatique des informations du médicament
* Base prête pour une intégration réelle avec **Tesseract.js**

### 🏠 Pharmacie à domicile

* Gestion du stock de médicaments
* Quantités ajustables (+ / −)
* Dates de péremption
* Catégorisation (antalgique, soin, etc.)
* Alertes automatiques :

  * Médicaments expirés
  * Expiration proche (≤ 3 mois)
  * Stock faible

### 🔔 Système de notifications

* Alertes visuelles intégrées au tableau de bord
* Notifications de confirmation (ajout, suppression, modification)

---

## 🛠️ Technologies utilisées

* **HTML5 / CSS3**
* **React 18** (via CDN)
* **Babel Standalone** (JSX dans le navigateur)
* **Lucide Icons** (icônes SVG)
* **Tesseract.js** (OCR – prêt à l’emploi, extraction désactivée)

Aucune installation ni build requis.

---

## 🚀 Lancer le projet

1. Télécharger ou cloner le dépôt
2. Ouvrir simplement le fichier :

```bash
index.html
```

3. Lancer le fichier dans un navigateur moderne (Chrome, Firefox, Edge)

> ✅ Aucune dépendance serveur ou base de données nécessaire

---

## 📁 Structure du projet

```bash
index.html       # Application complète (React + logique)
README.md             # Documentation du projet
```

Tout le code (UI, logique, styles) est volontairement contenu dans un seul fichier pour faciliter la démonstration et le prototypage.

---

## 🔮 Améliorations possibles

* Stockage persistant (LocalStorage / IndexedDB)
* Authentification utilisateur
* Notifications système (push / mobile)
* OCR réel avec extraction intelligente des médicaments
* Synchronisation cloud
* Version mobile (PWA)

---

## ⚠️ Avertissement

Cette application est un **prototype pédagogique / démonstratif**. Elle ne remplace pas un avis médical ou pharmaceutique.

---

## 👨‍💻 Auteur

Projet front‑end réalisé à des fins de démonstration UX/UI et logique applicative autour du suivi médical.

---

💡 *MediTrack : mieux suivre ses traitements, simplement.*
