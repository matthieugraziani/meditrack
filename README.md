# 💊 MediTrack

**Family pharmacy management & treatment tracking with OCR pipeline**

MediTrack est une application web full-stack permettant de gérer le stock de médicaments du foyer, de suivre l'observance des traitements par profil (parents / enfants) et d'automatiser la saisie des ordonnances via un pipeline de reconnaissance optique (OCR) sur mesure basé sur EasyOCR.

---

## Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Structure du dépôt](#-structure-du-dépôt)
- [Installation & lancement](#-installation--lancement)
- [Déploiement](#-déploiement)
- [Conformité RGPD & AI Act](#️-conformité-rgpd--ai-act)
- [Confidentialité & Conformité](#️-confidentialité--conformité)

---

## ✨ Fonctionnalités

| Domaine | Détail |
|---|---|
| **Pharmacie** | Inventaire des médicaments, alertes stock critique (≤ 5 unités), alertes péremption (< 90 j) |
| **Traitements** | Profils Parents / Enfants, semainier d'observance, rappels horaires par prise |
| **OCR Ordonnances** | Scan par photo ou import image, extraction Deep Learning (EasyOCR + PyTorch), validation ANSM/BDPM |
| **Gestion des profils** | Ajout de membres familiaux, avatars, dosages pédiatriques différenciés |

---

## 🏗 Architecture

Le projet est divisé en deux services indépendants et interconnectés :

### Backend — API Python (Render)

Exposé via **FastAPI**, le backend orchestre un pipeline IA en trois étapes :

- **`reader.py`** — Initialise et exécute EasyOCR (PyTorch) pour l'extraction textuelle haute performance sur documents flous ou manuscrits.
- **`matcher.py`** — Nettoie le texte extrait et effectue une recherche floue dans la base SQLite de la **BDPM** (Base de Données Publique des Médicaments — ANSM), générée par le repo dédié [`matthieugraziani/bdpm-database`](https://github.com/matthieugraziani/bdpm-database).
- **`pipeline.py`** — Orchestre les deux étapes précédentes et retourne un objet JSON structuré `{ molécule, dosage, fréquence }` prêt à l'emploi côté client.

### Frontend — SPA React (GitHub Pages)

Client léger sans bundler (Babel in-browser + React CDN) :

- Icônes SVG inline (aucune dépendance externe au runtime).
- Envoi de l'image de prescription en `multipart/form-data` vers `/ocr/scan`.
- Semainier dynamique par profil avec navigation hebdomadaire.
- Gestion de stock avec contrôle de quantité et badges d'alerte.

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Babel (in-browser), CSS custom properties |
| Backend | Python 3.11, FastAPI, Uvicorn |
| OCR | EasyOCR, PyTorch |
| Base médicaments | SQLite — BDPM (ANSM) — [`matthieugraziani/bdpm-database`](https://github.com/matthieugraziani/bdpm-database) |
| CI/CD | GitHub Actions → GitHub Pages (frontend), Render (backend) |

---

## 📂 Structure du dépôt

```text
meditrack/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Déploiement continu du dossier /frontend vers GitHub Pages
├── backend/
│   ├── ocr/
│   │   ├── reader.py         # Initialisation et exécution EasyOCR
│   │   ├── matcher.py        # Recherche floue dans la base BDPM (SQLite)
│   │   └── pipeline.py       # Orchestration lecture → matching → JSON
│   ├── main.py               # Point d'entrée FastAPI, routes et CORS
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app.js            # Composants React, logique métier, appels API
│   │   ├── api-config.js     # URL de l'API backend (Render)
│   │   └── style.css         # Styles globaux, variables CSS, responsive
│   └── index.html            # Shell HTML, imports CDN React/Babel
├── pyproject.toml
└── README.md
```

---

## 🚀 Installation & lancement

### Prérequis

- Python ≥ 3.11
- Node.js non requis (frontend sans bundler)

### Base de données BDPM

La base SQLite des médicaments est générée par un repo séparé. La récupérer avant de lancer le backend :

```bash
git clone https://github.com/matthieugraziani/bdpm-database
cp bdpm-database/bdpm.db backend/
```

> Voir [`matthieugraziani/bdpm-database`](https://github.com/matthieugraziani/bdpm-database) pour les détails de génération et de mise à jour.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

L'API est accessible sur `http://localhost:8000`. Le premier démarrage peut être long : EasyOCR télécharge ses modèles PyTorch (~200 Mo).

### Frontend

Aucune installation requise. Ouvrir `frontend/index.html` via un serveur local :

```bash
# Python
python -m http.server 5500 --directory frontend

# Node.js (npx)
npx serve frontend
```

Puis pointer `api-config.js` sur `http://localhost:8000`.

---

## 🌐 Déploiement

| Service | Cible | Déclencheur |
|---|---|---|
| **GitHub Pages** | `frontend/` | Push sur `main` via `deploy.yml` |
| **Render** | `backend/` | Push sur `main` (free tier — cold start ~30 s) |

> **Note cold start Render :** le plan gratuit met l'instance en veille après inactivité. Le premier appel OCR post-inactivité peut prendre 20 à 30 secondes — comportement normal, géré côté client par un message d'état.

---

## ⚖️ Confidentialité & Conformité

### RGPD

MediTrack ne collecte, ne stocke et ne transmet aucune donnée personnelle à des tiers. Toutes les informations saisies (profils, médicaments, traitements) sont conservées uniquement en mémoire locale dans le navigateur et disparaissent à la fermeture de l'onglet.

Lorsqu'un utilisateur utilise la fonctionnalité de scan d'ordonnance, l'image est transmise en HTTPS au serveur d'analyse, traitée en temps réel par EasyOCR, puis **supprimée immédiatement** — aucune image n'est conservée côté serveur.

### AI Act (Règlement européen sur l'IA)

Le pipeline OCR de MediTrack traite des images d'ordonnances médicales via un modèle de Deep Learning. Conformément au Règlement européen sur l'IA :

- Ce système est classé **risque limité** : il s'agit d'un outil d'assistance personnelle, non d'un système décisionnel médical autonome.
- Les résultats de l'IA sont **toujours soumis à la validation manuelle** de l'utilisateur avant tout enregistrement.
- MediTrack **n'est pas un dispositif médical certifié** et ne remplace pas l'avis d'un professionnel de santé.

Un bandeau d'information RGPD/IA est affiché au premier lancement de l'application et doit être explicitement accepté par l'utilisateur.

---

## ⚖️ Conformité RGPD & AI Act

### Données personnelles (RGPD)

| Donnée | Traitement |
|---|---|
| Profils familiaux, médicaments, traitements | Stockés **uniquement en mémoire locale** (RAM) — aucune persistance, aucun serveur |
| Images d'ordonnances | Transmises en HTTPS à l'API Render pour analyse OCR, **supprimées immédiatement** après traitement |
| Cookies / tracking | **Aucun** |

L'infrastructure backend est hébergée sur Render (AWS us-east-1, conforme RGPD). Un bandeau de consentement est affiché au premier lancement de l'application.

### Intelligence artificielle (AI Act)

MediTrack utilise un pipeline EasyOCR pour assister la saisie d'ordonnances. Ce système est classé **risque limité** au sens du règlement européen AI Act :

- Il n'effectue **aucune décision médicale autonome**.
- Chaque résultat OCR doit être **vérifié et validé manuellement** par l'utilisateur avant tout enregistrement.
- L'application n'est **pas un dispositif médical certifié** et ne remplace pas l'avis d'un professionnel de santé.

---

## 📄 Licence

[MIT](LICENSE)
