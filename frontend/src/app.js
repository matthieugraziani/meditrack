const { useState, useEffect } = React;

// ─── ICONES COMPONENT DE SECOURS (LUCIDE) ──────────────────────────────────
// Permet de s'assurer qu'un rendu visuel minimal s'affiche si Lucide tarde à s'initialiser
const Home = () => <i data-lucide="home"></i>;
const Users = () => <i data-lucide="users"></i>;
const Baby = () => <i data-lucide="baby"></i>;
const UserPlus = () => <i data-lucide="user-plus"></i>;
const Pill = () => <i data-lucide="pill"></i>;
const Plus = () => <i data-lucide="plus"></i>;
const Camera = () => <i data-lucide="camera"></i>;
const X = () => <i data-lucide="x"></i>;
const Check = () => <i data-lucide="check"></i>;
const Calendar = () => <i data-lucide="calendar"></i>;
const AlertCircle = () => <i data-lucide="alert-circle"></i>;
const ChevronLeft = () => <i data-lucide="chevron-left"></i>;
const ChevronRight = () => <i data-lucide="chevron-right"></i>;

const MedicationApp = () => {
  // ─── ÉTATS DE L'APPLICATION (STATES) ─────────────────────────────────────
  // Vues supportées : pharmacy, parents, children, addPerson, scan, addMed, addPharmacyMed
  const [view, setView] = useState('pharmacy'); 
  const [selectedPerson, setSelectedPerson] = useState(null);
  
  // Données initiales de simulation (Mock) pour les profils familiaux
  const [parents, setParents] = useState([
    { id: 1, name: 'Matthieu GRAZIANI', avatar: '👨', color: '#4ecdc4', type: 'parent' },
    { id: 2, name: 'Elisabeth GRAZIANI', avatar: '👩', color: '#ff6b9d', type: 'parent' }
  ]);
  
  const [children, setChildren] = useState([
    { id: 3, name: 'Léo', avatar: '👦', age: 17, color: '#ffd93d', type: 'child' },
    { id: 4, name: 'Lilly', avatar: '👧', age: 13, color: '#a8e6cf', type: 'child' },
    { id: 5, name: 'Lou', avatar: '👧', age: 11, color: '#ff9e7d', type: 'child' }
  ]);
  
  // Suivi des ordonnances actives et prises par personne
  const [medications, setMedications] = useState({
    1: [{ id: 1, name: 'Doliprane 1000mg', dosage: '1 comprimé', times: ['08:00', '20:00'], endDate: '2026-12-31', taken: {} }],
    2: [{ id: 2, name: 'Levothyrox', dosage: '75µg', times: ['07:00'], endDate: '2027-03-08', taken: {} }],
    3: [], 4: [], 5: []
  });
  
  // Stock global de la pharmacie de maison
  const [homePharmacy, setHomePharmacy] = useState([
    { id: 1, name: 'Doliprane', dosages: ['1000mg'], quantity: 24, expiryDate: '2026-12-31', category: 'Antalgique', image: '💊' },
    { id: 2, name: 'Ibuprofène', dosages: ['400mg'], quantity: 4, expiryDate: '2026-08-15', category: 'Anti-inflammatoire', image: '💊' }, /* Cas Rupture proche */
    { id: 3, name: 'Spasfon', dosages: ['80mg'], quantity: 12, expiryDate: '2025-01-20', category: 'Antispasmodique', image: '💊' }, /* Cas Expiré */
    { id: 4, name: 'Smecta', dosages: ['3g'], quantity: 8, expiryDate: '2026-07-10', category: 'Digestif', image: '📦' },
    { id: 5, name: 'Biafine', dosages: ['tube 100ml'], quantity: 2, expiryDate: '2026-09-30', category: 'Soin', image: '🧴' } /* Cas Expiration Proche */
  ]);

  // Formulaires réactifs (States de saisies)
  const [newPerson, setNewPerson] = useState({ name: '', type: 'parent', avatar: '👤', age: '' });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', times: [''], endDate: '' });
  const [newPharmacyItem, setNewPharmacyItem] = useState({ name: '', category: 'Antalgique', quantity: 1, expiryDate: '', dosage: '', image: '💊' });

  // États du Pipeline EasyOCR Backend
  const [scanFile, setScanFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [detectedMedications, setDetectedMedications] = useState([]);

  // Système de notifications global
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // ─── EFFETS (EFFECTS) ────────────────────────────────────────────────────
  // Ping de réveil automatique de l'API sur Render au chargement de l'application
  useEffect(() => {
    fetch(`${API_BDPM_URL}/`)
      .then(r => r.json())
      .then(data => console.log("Connexion API établie :", data.message))
      .catch(err => console.warn("L'API Render est en veille. Premier appel ralenti (Cold start).", err));
  }, []);

  // Forcer la regénération des icônes Lucide à chaque re-rendu de composants
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // ─── FONCTIONS UTILITAIRES / LOGIQUE METIER ──────────────────────────────
  const isExpired = (date) => new Date(date) < new Date();
  
  const isExpiringSoon = (date) => {
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 90 && days > 0;
  };

  const updatePharmacyQuantity = (id, change) => {
    setHomePharmacy(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    ));
  };

  const removePharmacyItem = (id) => {
    setHomePharmacy(prev => prev.filter(item => item.id !== id));
    triggerNotification('Médicament retiré de la pharmacie');
  };

  const triggerNotification = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getWeekDates = (offset = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (offset * 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // ─── ACTIONS FORMULAIRES ─────────────────────────────────────────────────
  const addPerson = () => {
    if (!newPerson.name) return;
    const newId = Math.max(...[...parents, ...children].map(p => p.id), 0) + 1;
    const person = {
      id: newId,
      name: newPerson.name,
      avatar: newPerson.avatar,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      ...(newPerson.type === 'child' ? { age: parseInt(newPerson.age) || 0 } : {}),
      type: newPerson.type
    };
    
    if (newPerson.type === 'parent') setParents([...parents, person]);
    else setChildren([...children, person]);
    
    setMedications(prev => ({ ...prev, [newId]: [] }));
    setNewPerson({ name: '', type: 'parent', avatar: '👤', age: '' });
    setView('pharmacy');
    triggerNotification('Membre de la famille ajouté !');
  };

  const handleAddPharmacyItem = () => {
    if (!newPharmacyItem.name || !newPharmacyItem.expiryDate) return;

    const newItem = {
      id: Date.now(),
      name: newPharmacyItem.name,
      dosages: [newPharmacyItem.dosage || 'Standard'],
      quantity: parseInt(newPharmacyItem.quantity) || 1, // ✅ Corrigé
      expiryDate: newPharmacyItem.expiryDate,
      category: newPharmacyItem.category,
      image: newPharmacyItem.image
    };

    setHomePharmacy([...homePharmacy, newItem]);
    setNewPharmacyItem({ name: '', category: 'Antalgique', quantity: 1, expiryDate: '', dosage: '', image: '💊' });
    setView('pharmacy');
    triggerNotification('✅ Médicament enregistré dans l\'armoire !');
  };

  const addMedication = () => {
    if (!selectedPerson || !newMedication.name) return;
    
    const newMed = {
      id: Date.now(),
      ...newMedication,
      color: [...parents, ...children].find(p => p.id === selectedPerson).color,
      taken: {}
    };
    
    setMedications(prev => ({
      ...prev,
      [selectedPerson]: [...(prev[selectedPerson] || []), newMed]
    }));
    
    setNewMedication({ name: '', dosage: '', times: [''], endDate: '' });
    setView('pharmacy');
    triggerNotification('✅ Traitement ajouté au profil !');
  };

  // ─── PIPELINE IA / EASYOCR BACKEND (RÉÉCRIT) ─────────────────────────────
  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanFile(URL.createObjectURL(file));
    setIsProcessing(true);
    setOcrProgress(40);
    setOcrStatus('Transmission sécurisée au serveur IA (EasyOCR)...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Requête HTTP POST multipart vers l'API Python
      const response = await fetch(`${API_BDPM_URL}/ocr/scan`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Échec du traitement de l\'image par le serveur.');
      
      setOcrProgress(80);
      setOcrStatus('Matching et validation avec la base nationale ANSM...');
      
      const data = await response.json(); 
      setDetectedMedications(data);
      
      if (data && data.length > 0) {
        setNewMedication(data[0]);
        setOcrStatus(`✅ ${data.length} molécule(s) certifiée(s) par l'ANSM !`);
      } else {
        setOcrStatus('⚠️ Texte extrait mais aucun médicament correspondant en base de données.');
      }
      
      setOcrProgress(100);
      setIsProcessing(false);
      setTimeout(() => setView('addMed'), 1500);
      
    } catch (error) {
      console.error('Erreur OCR Serveur:', error);
      setOcrStatus('❌ Erreur de traitement (Le serveur gratuit est peut-être en veille)');
      setIsProcessing(false);
      setTimeout(() => setView('addMed'), 2500);
    }
  };

  // ─── NAV BAR BARRE INFERIEURE RESPONSIVE ─────────────────────────────────
  const BottomNav = () => (
    <div class="bottom-nav">
      <button onClick={() => setView('pharmacy')} class={`nav-item ${view === 'pharmacy' ? 'active' : ''}`}>
        <Home />Pharmacie
      </button>
      <button onClick={() => setView('parents')} class={`nav-item ${view === 'parents' ? 'active' : ''}`}>
        <Users />Parents
      </button>
      <button onClick={() => setView('children')} class={`nav-item ${view === 'children' ? 'active' : ''}`}>
        <Baby />Enfants
      </button>
      <button onClick={() => setView('addPerson')} class={`nav-item ${view === 'addPerson' ? 'active' : ''}`}>
        <UserPlus />+ Profil
      </button>
    </div>
  );

  // ─── RENDUS DES COMPOSANTS DE VUES (VIEWS) ───────────────────────────────

  // 1. COMPOSANT : PHARMACIE GLOBALE
  if (view === 'pharmacy') {
    const expired = homePharmacy.filter(item => isExpired(item.expiryDate));
    const expiringSoon = homePharmacy.filter(item => isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate));
    const lowStock = homePharmacy.filter(item => item.quantity <= 5);
    
    return (
      <div class="app-container">
        <div class="app-header pharmacy app-header-flex">
          <div>
            <h1>🏠 Pharmacie Familiale</h1>
            <p style={{ opacity: 0.9 }}>{homePharmacy.length} références en stock</p>
          </div>
          <button onClick={() => setView('addPharmacyMed')} style={{ background: 'white', color: '#38a169', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Plus /> Ajouter un produit
          </button>
        </div>

        <div class="main-content">
          {/* Panneaux d'alertes sanitaires conditionnels */}
          {(expired.length > 0 || expiringSoon.length > 0 || lowStock.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              {expired.length > 0 && (
                <div style={{ background: '#fff5f5', border: '2px solid #fc8181', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#c53030' }}>
                  <AlertCircle style={{ color: '#e53e3e' }} />
                  <div><strong>{expired.length} produit(s) expiré(s) !</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Veuillez les rapporter pour recyclage sécurisé (Cyclamed).</p></div>
                </div>
              )}
              {expiringSoon.length > 0 && (
                <div style={{ background: '#fffaf0', border: '2px solid #f6ad55', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#c05621' }}>
                  <AlertCircle style={{ color: '#dd6b20' }} />
                  <div><strong>{expiringSoon.length} produit(s) en fin de validité</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Échéance stricte dans moins de 90 jours.</p></div>
                </div>
              )}
              {lowStock.length > 0 && (
                <div style={{ background: '#ebf8ff', border: '2px solid #90cdf4', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', color: '#2c5282' }}>
                  <AlertCircle style={{ color: '#3182ce' }} />
                  <div><strong>{lowStock.length} alerte(s) de stock critique</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Quantité restante en armoire inférieure ou égale à 5 unités.</p></div>
                </div>
              )}
            </div>
          )}

          {/* Grille responsive de cartes */}
          <div class="pharmacy-grid">
            {homePharmacy.map(item => {
              const hasExpired = isExpired(item.expiryDate);
              const willExpire = isExpiringSoon(item.expiryDate);
              const isLow = item.quantity <= 5;
              
              return (
                <div key={item.id} class="card" style={{ opacity: hasExpired ? 0.55 : 1, border: hasExpired ? '2px solid #fc8181' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px' }}>
                    <div style={{ fontSize: '36px' }}>{item.image}</div>
                    <button onClick={() => removePharmacyItem(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#fee', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{item.name}</h3>
                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>{item.dosages.join(', ')}</div>
                  <div style={{ fontSize: '11px', background: '#edf2f7', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '12px', fontWeight: '600' }}>{item.category}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updatePharmacyQuantity(item.id, -1)} disabled={item.quantity === 0} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #48bb78', background: 'white', color: '#48bb78', cursor: 'pointer', fontWeight: '800' }}>-</button>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: isLow ? '#e53e3e' : '#2d3748', minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updatePharmacyQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #48bb78', background: 'white', color: '#48bb78', cursor: 'pointer', fontWeight: '800' }}>+</button>
                    </div>
                    <div style={{ fontSize: '11px', color: hasExpired ? '#e53e3e' : willExpire ? '#d69e2e' : '#718096', fontWeight: '700' }}>
                      {new Date(item.expiryDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <BottomNav />
        {showNotification && <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#48bb78', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1000, fontWeight: '600' }}>{notificationMessage}</div>}
      </div>
    );
  }

  // 2. COMPOSANT : FORMULAIRE ENTRÉE MANUELLE PHARMACIE STOCK
  if (view === 'addPharmacyMed') {
    return (
      <div class="app-container">
        <div class="app-header pharmacy">
          <button onClick={() => setView('pharmacy')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px', fontWeight: '600' }}>← Annuler</button>
          <h2>Ajouter un produit à l'armoire</h2>
        </div>

        <div class="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div class="card">
            <div class="form-group">
              <label>Nom de la référence *</label>
              <input type="text" class="form-control" value={newPharmacyItem.name} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, name: e.target.value })} placeholder="Ex: Doliprane, Maalox, Gaviscon..." />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div class="form-group" style={{ flex: '2 1 200px' }}>
                <label>Grammage / Format</label>
                <input type="text" class="form-control" value={newPharmacyItem.dosage} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, dosage: e.target.value })} placeholder="Ex: 500mg, Tube 100ml..." />
              </div>
              <div class="form-group" style={{ flex: '1 1 100px' }}>
                <label>Quantité</label>
                <input type="number" min="1" class="form-control" value={newPharmacyItem.quantity} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, quantity: e.target.value })} />
              </div>
            </div>

            <div class="form-group">
              <label>Famille thérapeutique</label>
              <select class="form-control" value={newPharmacyItem.category} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, category: e.target.value })}>
                <option value="Antalgique">Antalgique (Douleur / Fièvre)</option>
                <option value="Anti-inflammatoire">Anti-inflammatoire</option>
                <option value="Antispasmodique">Antispasmodique</option>
                <option value="Digestif">Digestif / Transit</option>
                <option value="Soin">Soin / Crème / Pommade</option>
                <option value="Antibiotique">Antibiotique</option>
                <option value="Autre">Autre catégorie</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div class="form-group" style={{ flex: '2 1 200px' }}>
                <label>Date limite de péremption *</label>
                <input type="date" class="form-control" value={newPharmacyItem.expiryDate} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, expiryDate: e.target.value })} />
              </div>
              <div class="form-group" style={{ flex: '1 1 100px' }}>
                <label>Forme</label>
                <select class="form-control" value={newPharmacyItem.image} onChange={(e) => setNewPharmacyItem({ ...newPharmacyItem, image: e.target.value })} style={{ fontSize: '18px' }}>
                  <option value="💊">💊 Comprimé</option>
                  <option value="📦">📦 Boîte</option>
                  <option value="🧴">🧴 Crème</option>
                  <option value="💧">💧 Gouttes</option>
                  <option value="⚗️">⚗️ Sirop</option>
                </select>
              </div>
            </div>

            <button onClick={handleAddPharmacyItem} disabled={!newPharmacyItem.name || !newPharmacyItem.expiryDate} style={{ width: '100%', padding: '16px', background: newPharmacyItem.name && newPharmacyItem.expiryDate ? '#48bb78' : '#cbd5e0', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' }}>
              ✓ Enregistrer dans le stock
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 3. COMPOSANT : DESCRIPTIF DES PROFILS PARENTS
  if (view === 'parents') {
    return (
      <div class="app-container">
        <div class="app-header parents">
          <h1>👨‍👩 Parents</h1>
          <p style={{ opacity: 0.9 }}>Suivi de traitement et observance adulte</p>
        </div>

        <div class="main-content">
          <div class="people-layout">
            {parents.map(parent => {
              const meds = medications[parent.id] || [];
              const weekDates = getWeekDates(currentWeekOffset);
              const today = new Date().toISOString().split('T')[0];
              
              return (
                <div key={parent.id} class="card" style={{ borderLeft: `5px solid ${parent.color}` }}>
                  <div class="profile-card-header">
                    <div style={{ fontSize: '48px' }}>{parent.avatar}</div>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: '700' }}>{parent.name}</h2>
                      <p style={{ fontSize: '13px', color: '#718096' }}>{meds.length} ordonnance(s) en cours</p>
                    </div>
                    <button onClick={() => { setSelectedPerson(parent.id); setView('scan'); }} style={{ background: parent.color, color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Camera /> Numériser ordonnance
                    </button>
                  </div>

                  {meds.length > 0 ? (
                    <>
                      <div style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700' }}>📅 Suivi semainier informatique</h4>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)} style={{ border: 'none', background: '#edf2f7', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><ChevronLeft /></button>
                            <button onClick={() => setCurrentWeekOffset(0)} style={{ border: 'none', background: '#667eea', color: 'white', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Aujourd'hui</button>
                            <button onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)} style={{ border: 'none', background: '#edf2f7', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}><ChevronRight /></button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                          {weekDates.map(date => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isToday = dateStr === today;
                            const activeMeds = meds.filter(m => date <= new Date(m.endDate));
                            return (
                              <div key={dateStr} style={{ background: isToday ? parent.color : '#f7fafc', color: isToday ? 'white' : '#2d3748', borderRadius: '10px', padding: '6px 2px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }}>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                                <div style={{ fontSize: '16px', fontWeight: '800' }}>{date.getDate()}</div>
                                {activeMeds.length > 0 && <div style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>{activeMeds.length} pr.</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        {meds.map(med => (
                          <div key={med.id} style={{ background: '#f7fafc', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '700', fontSize: '15px' }}>{med.name}</div>
                            <div style={{ fontSize: '13px', color: '#718096' }}>{med.dosage} — Valide jusqu'au {new Date(med.endDate).toLocaleDateString('fr-FR')}</div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {med.times.map(time => <span key={time} style={{ background: parent.color, color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>⏰ {time}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#cbd5e0' }}><Pill style={{ width: '36px', margin: '0 auto 8px', opacity: 0.5 }} /><p style={{ fontSize: '13px' }}>Aucun traitement en cours pour ce profil.</p></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 4. COMPOSANT : DESCRIPTIF DES PROFILS ENFANTS (DOSAGES PEEDIATRIQUES)
  if (view === 'children') {
    return (
      <div class="app-container">
        <div class="app-header children">
          <h1>👶 Enfants</h1>
          <p style={{ opacity: 0.9 }}>Vérifications et prescriptions pédiatriques</p>
        </div>

        <div class="main-content">
          <div class="people-layout">
            {children.map(child => {
              const meds = medications[child.id] || [];
              return (
                <div key={child.id} class="card" style={{ borderLeft: `5px solid ${child.color}` }}>
                  <div class="profile-card-header">
                    <div style={{ fontSize: '48px' }}>{child.avatar}</div>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: '700' }}>{child.name}</h2>
                      <p style={{ fontSize: '13px', color: '#718096' }}>{child.age} ans • {meds.length} suivi(s)</p>
                    </div>
                    <button onClick={() => { setSelectedPerson(child.id); setView('scan'); }} style={{ background: child.color, color: '#2d3748', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Camera /> Numériser ordonnance
                    </button>
                  </div>

                  {meds.length > 0 ? (
                    <div>
                      {meds.map(med => (
                        <div key={med.id} style={{ background: '#f7fafc', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>{med.name}</div>
                          <div style={{ fontSize: '13px', color: '#718096' }}>Posologie enfant : <strong>{med.dosage}</strong></div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            {med.times.map(time => <span key={time} style={{ background: child.color, color: '#2d3748', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>⏰ {time}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#cbd5e0' }}><Pill style={{ width: '36px', margin: '0 auto 8px', opacity: 0.5 }} /><p style={{ fontSize: '13px' }}>Aucun sirop ou traitement pédiatrique actif.</p></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 5. COMPOSANT : AJOUTER UN PROFIL MEMBRE DE LA FAMILLE
  if (view === 'addPerson') {
    return (
      <div class="app-container">
        <div class="app-header" style={{ background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' }}>
          <h1>➕ Profil Familial</h1>
        </div>

        <div class="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div class="card">
            <div class="form-group">
              <label>Rôle au sein du foyer</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setNewPerson({ ...newPerson, type: 'parent', avatar: '👨' })} style={{ flex: 1, padding: '14px', border: `2px solid ${newPerson.type === 'parent' ? '#667eea' : '#e2e8f0'}`, background: newPerson.type === 'parent' ? '#eef2ff' : 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>👨‍👩 Adulte / Parent</button>
                <button onClick={() => setNewPerson({ ...newPerson, type: 'child', avatar: '👦' })} style={{ flex: 1, padding: '14px', border: `2px solid ${newPerson.type === 'child' ? '#ffd93d' : '#e2e8f0'}`, background: newPerson.type === 'child' ? '#fffbeb' : 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>👶 Enfant / Nourrisson</button>
              </div>
            </div>

            <div class="form-group">
              <label>Nom complet (Prénom Nom) *</label>
              <input type="text" class="form-control" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="Ex: Jean Graziani" />
            </div>

            {newPerson.type === 'child' && (
              <div class="form-group">
                <label>Âge de l'enfant (Requis pour contrôle pédiatrique)</label>
                <input type="number" class="form-control" value={newPerson.age} onChange={(e) => setNewPerson({ ...newPerson, age: e.target.value })} placeholder="Ex: 8" />
              </div>
            )}

            <div class="form-group">
              <label>Sélectionner un émoji d'identité</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {(newPerson.type === 'parent' ? ['👨', '👩', '🧑', '👴', '👵'] : ['👦', '👧', '🧒', '👶', '🍼']).map(emoji => (
                  <button key={emoji} onClick={() => setNewPerson({ ...newPerson, avatar: emoji })} style={{ padding: '12px', fontSize: '28px', border: `2px solid ${newPerson.avatar === emoji ? '#667eea' : '#e2e8f0'}`, background: 'white', borderRadius: '12px', cursor: 'pointer' }}>{emoji}</button>
                ))}
              </div>
            </div>

            <button onClick={addPerson} disabled={!newPerson.name} style={{ width: '100%', padding: '16px', background: newPerson.name ? '#764ba2' : '#cbd5e0', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: 'pointer' }}>
              ✓ Enregistrer le membre
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 6. COMPOSANT : APPAREIL PHOTO NUMÉRISATION ORDONNANCE (EASYOCR PIPELINE)
  if (view === 'scan') {
    const person = [...parents, ...children].find(p => p.id === selectedPerson);
    
    // Si aucune personne n'est sélectionnée, on ne plante pas l'application
    if (!person) return null; 

    return (
      <div className="app-container"> {/* Remplacer class par className */}
        <div className="app-header" style={{ background: `linear-gradient(135deg, ${person.color} 0%, #2d3748 100%)` }}>
          <button onClick={() => setView(person.type === 'parent' ? 'parents' : 'children')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px' }}>← Retour</button>
          <h2>Analyseur IA d'Ordonnance</h2>
          <p style={{ opacity: 0.9 }}>Dossier médical ciblé : {person.name}</p>
        </div>

        <div class="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div class="card" style={{ padding: '40px 20px', textAlign: 'center', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!scanFile ? (
              <div>
                <input type="file" id="ocr-file-upload" accept="image/*" onChange={handleScanUpload} style={{ display: 'none' }} />
                <label htmlFor="ocr-file-upload" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '64px', marginBottom: '12px' }}>📄</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Téléverser la prescription médicale</h3>
                  <p style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>Prenez en photo l'ordonnance papier ou importez un scan (JPG, PNG)</p>
                  <div style={{ background: person.color, color: person.type === 'child' ? '#2d3748' : 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', display: 'inline-block' }}>Ouvrir l'appareil photo</div>
                </label>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={scanFile} style={{ width: '100%', borderRadius: '12px', maxHeight: '450px', objectFit: 'contain' }} alt="Scan ordonnance" />
                {isProcessing && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45, 55, 72, 0.95)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Deep Learning en cours...</h3>
                    <div style={{ width: '80%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#48bb78', width: `${ocrProgress}%`, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: '13px', opacity: 0.9 }}>{ocrStatus}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. COMPOSANT : VALIDATION ET AJOUT DU MÉDICAMENT DETECTÉ PAR L'OCR
  if (view === 'addMed') {
    const person = [...parents, ...children].find(p => p.id === selectedPerson);
    return (
      <div class="app-container">
        <div class="app-header" style={{ background: `linear-gradient(135deg, ${person.color} 0%, #2d3748 100%)` }}>
          <button onClick={() => setView('scan')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px' }}>← Réanalyser</button>
          <h2>Posologie Extrait du Document</h2>
        </div>

        <div class="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div class="card">
            {detectedMedications.length > 0 && (
              <div style={{ padding: '12px', background: '#f0fff4', border: '2px solid #48bb78', borderRadius: '12px', marginBottom: '20px', color: '#22543d', fontSize: '13px', fontWeight: '600' }}>
                ✓ EasyOCR & ANSM : La désignation de la molécule est validée scientifiquement.
              </div>
            )}
            
            <div class="form-group">
              <label>Molécule certifiée</label>
              <input type="text" class="form-control" value={newMedication.name} onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })} />
            </div>

            <div class="form-group">
              <label>Dosage unitaire prescrit</label>
              <input type="text" class="form-control" value={newMedication.dosage} onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })} placeholder="Ex: 1 comprimé, 1 mesure-chette..." />
            </div>

            <div class="form-group">
              <label>Heures de notifications (Rappels quotidiens)</label>
              {newMedication.times.map((time, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="time" class="form-control" value={time} onChange={(e) => { const newTimes = [...newMedication.times]; newTimes[idx] = e.target.value; setNewMedication({ ...newMedication, times: newTimes }); }} />
                  {newMedication.times.length > 1 && <button onClick={() => { const newTimes = newMedication.times.filter((_, i) => i !== idx); setNewMedication({ ...newMedication, times: newTimes }); }} style={{ width: '48px', border: '2px solid #fc8181', background: 'white', color: '#fc8181', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>}
                </div>
              ))}
              <button onClick={() => setNewMedication({ ...newMedication, times: [...newMedication.times, ''] })} style={{ width: '100%', padding: '10px', background: '#edf2f7', border: '2px dashed #cbd5e0', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>+ Ajouter une prise journalière</button>
            </div>

            <div class="form-group">
              <label>Fin estimée de la prescription médicale</label>
              <input type="date" class="form-control" value={newMedication.endDate} onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })} />
            </div>

            <button onClick={addMedication} disabled={!newMedication.name || !newMedication.dosage} style={{ width: '100%', padding: '16px', background: newMedication.name && newMedication.dosage ? person.color : '#cbd5e0', color: person.type === 'child' ? '#2d3748' : 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>
              ✓ Valider et inscrire au semainier
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ─── INSTANCIATION DE L'ARBRE DOM REACT ────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MedicationApp />);