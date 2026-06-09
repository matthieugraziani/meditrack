# 💊 MediTrack — Pharmacie Familiale & Suivi Thérapeutique (Moteur EasyOCR)

MediTrack est une application web full-stack (React / FastAPI) conçue pour la gestion de la pharmacie du foyer, le suivi d'observance des traitements médicaux et l'automatisation des saisies d'ordonnances grâce à un pipeline de reconnaissance optique (OCR) sur mesure.

---

## 🚀 Spécificités Techniques & Architecture

Le projet est divisé en deux entités distinctes interconnectées :

### 🐍 Backend Python (Hébergé sur Render)
Situé dans le dossier `/backend`, il expose une API robuste construite avec **FastAPI** et un moteur d'intelligence artificielle :
- **`reader.py` :** Initialise et exécute **EasyOCR** (Deep Learning / PyTorch) pour une extraction textuelle hautement performante, surpassant les moteurs traditionnels sur les documents flous ou manuscrits.
- **`matcher.py` :** Algorithme de réconciliation de chaînes. Il nettoie le texte extrait, filtre les bruits et effectue une recherche floue dans la base SQLite locale de la **BDPM** (Base de Données Publique des Médicaments de l'ANSM).
- **`pipeline.py` :** Orchestre la lecture et le matching pour retourner un objet JSON structuré (Molécule, Dosage détecté, Fréquence) directement exploitable par l'interface.

### ⚛️ Frontend React (Déployé sur GitHub Pages)
Situé dans le dossier `/frontend`, c'est un client léger (SPA) :
- Envoie l'image de la prescription sous forme de `FormData` à l'endpoint `/ocr/scan`.
- Gère l'interface utilisateur, le semainier dynamique d'observance par profil (Parents/Enfants) et le contrôle des stocks de la pharmacie.

---

## 📂 Structure du Dépôt

```text
├── .github/workflows/
│   └── deploy.yml          # Déploiement continu du dossier /frontend
├── backend/                # Moteur d'extraction IA & API
│   ├── ocr/
│   │   ├── matcher.py
│   │   ├── pipeline.py
│   │   └── reader.py
│   ├── main.py
│   └── requirements.txt
└── frontend/               # Interface Utilisateur (SPA)
    ├── src/
    │   ├── api-config.js
    │   ├── app.js          # Appels asynchrones vers l'API EasyOCR
    │   └── style.css
    └── index.html