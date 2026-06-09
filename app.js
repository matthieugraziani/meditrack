const { useState, useEffect } = React;

// ─── Extracteurs auxiliaires pour l'ordonnance ───────────────────────────
const extractDosage = (text) => {
  const patterns = [
    /(\d+\.?\d*)\s*(MG|G|ML|MCG|µG|UI)/i,
    /(\d+\.?\d*)\s*(CP|COMPRIME|GELULE|SACHET|ML)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = match[1];
      let unit = match[2].toLowerCase();
      if (unit === 'mcg') unit = 'µg';
      if (unit.includes('comprim') || unit.includes('gelule')) unit = 'mg';
      return value + unit;
    }
  }
  return null;
};

const extractFrequency = (text) => {
  const upper = text.toUpperCase();
  if (/MATIN\s*MIDI\s*SOIR/.test(upper)) return 3;
  if (/MATIN\s*ET\s*SOIR/.test(upper)) return 2;
  const m = upper.match(/(\d+)\s*(?:FOIS|X)?\s*PAR\s*JOUR/);
  if (m) return parseInt(m[1]) || 1;
  return 2;
};

// Composants d'icônes Lucide
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
  const [view, setView] = useState('pharmacy'); // pharmacy, parents, children, addPerson, scan, addMed
  const [selectedPerson, setSelectedPerson] = useState(null);
  
  const [parents, setParents] = useState([
    { id: 1, name: 'Matthieu GRAZIANI', avatar: '👨', color: '#4ecdc4', type: 'parent' },
    { id: 2, name: 'Elisabeth GRAZIANI', avatar: '👩', color: '#ff6b9d', type: 'parent' }
  ]);
  
  const [children, setChildren] = useState([
    { id: 3, name: 'Léo', avatar: '👦', age: 17, color: '#ffd93d', type: 'child' },
    { id: 4, name: 'Lilly', avatar: '👧', age: 13, color: '#a8e6cf', type: 'child' },
    { id: 5, name: 'Lou', avatar: '👧', age: 11, color: '#ff9e7d', type: 'child' }
  ]);
  
  const [medications, setMedications] = useState({
    1: [{ id: 1, name: 'Doliprane 1000mg', dosage: '1 comprimé', times: ['08:00', '20:00'], endDate: '2026-02-20', taken: {} }],
    2: [{ id: 2, name: 'Levothyrox', dosage: '75µg', times: ['07:00'], endDate: '2026-03-08', taken: {} }],
    3: [],
    4: []
  });
  
  const [homePharmacy, setHomePharmacy] = useState([
    { id: 1, name: 'Doliprane', dosages: ['500mg', '1000mg'], quantity: 24, expiryDate: '2026-12-31', category: 'Antalgique', image: '💊' },
    { id: 2, name: 'Ibuprofène', dosages: ['200mg', '400mg'], quantity: 16, expiryDate: '2026-08-15', category: 'Anti-inflammatoire', image: '💊' },
    { id: 3, name: 'Spasfon', dosages: ['80mg'], quantity: 12, expiryDate: '2027-03-20', category: 'Antispasmodique', image: '💊' },
    { id: 4, name: 'Smecta', dosages: ['3g'], quantity: 8, expiryDate: '2026-06-10', category: 'Digestif', image: '📦' },
    { id: 5, name: 'Biafine', dosages: ['tube 100ml'], quantity: 2, expiryDate: '2026-11-30', category: 'Soin', image: '🧴' },
    { id: 6, name: 'Sérum physiologique', dosages: ['5ml'], quantity: 30, expiryDate: '2027-01-15', category: 'Soin', image: '💧' }
  ]);

  const [newPerson, setNewPerson] = useState({ name: '', type: 'parent', avatar: '👤', age: '' });
  const [scanFile, setScanFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [detectedMedications, setDetectedMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', times: [''], endDate: '' });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Ping l'API Render (définie dans api-config.js) au démarrage de l'app pour limiter la latence de veille
  useEffect(() => {
    fetch(`${API_BDPM_URL}/`)
      .then(r => r.json())
      .then(data => console.log("Connexion API active :", data.message))
      .catch(err => console.warn("L'API Render est en veille ou injoignable. Premier appel ralenti.", err));
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

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
    setNotificationMessage('Médicament retiré');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

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
    
    if (newPerson.type === 'parent') {
      setParents([...parents, person]);
    } else {
      setChildren([...children, person]);
    }
    
    setMedications(prev => ({ ...prev, [newId]: [] }));
    setNewPerson({ name: '', type: 'parent', avatar: '👤', age: '' });
    setView('pharmacy');
    setNotificationMessage('Personne ajoutée !');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Pipeline OCR + API distante
  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanFile(URL.createObjectURL(file));
    setIsProcessing(true);
    setOcrProgress(0);
    setOcrStatus('Initialisation de la lecture...');
    
    try {
      const worker = await Tesseract.createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
            setOcrStatus(`Analyse du texte : ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      setOcrStatus('Interrogation de la base de données nationale...');
      const lines = text.split('\n').filter(l => l.trim().length >= 4);
      const seenNames = new Set();
      const found = [];

      for (const line of lines) {
        try {
          const response = await fetch(`${API_BDPM_URL}/medicaments/search?q=${encodeURIComponent(line.trim())}`);
          if (!response.ok) continue;
          
          const searchResults = await response.json();
          
          if (searchResults && searchResults.length > 0) {
            const bestMatch = searchResults[0];
            
            if (seenNames.has(bestMatch.DENOMINATION)) continue;
            seenNames.add(bestMatch.DENOMINATION);

            const dosage = extractDosage(line) || "1 comprimé";
            const freq = extractFrequency(line);
            const times = freq === 1 ? ['08:00'] : freq === 2 ? ['08:00', '20:00'] : ['08:00', '14:00', '20:00'];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            found.push({
              name: bestMatch.DENOMINATION,
              dosage: dosage,
              times: times,
              endDate: endDate.toISOString().split('T')[0],
              confiance: 0.90
            });
          }
        } catch (apiErr) {
          console.error("Erreur API ligne :", line, apiErr);
        }
      }
      
      setDetectedMedications(found);
      if (found.length > 0) {
        setNewMedication(found[0]);
        setOcrStatus(`✅ ${found.length} médicament(s) identifié(s) via l'ANSM !`);
      } else {
        setOcrStatus('⚠️ Aucun médicament reconnu dans la base BDPM');
      }
      
      setOcrProgress(100);
      setIsProcessing(false);
      setTimeout(() => setView('addMed'), 1500);
      
    } catch (error) {
      console.error('Erreur globale OCR:', error);
      setOcrStatus('❌ Échec de l\'analyse');
      setIsProcessing(false);
      setTimeout(() => setView('addMed'), 1500);
    }
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
    setNotificationMessage('✅ Médicament ajouté au traitement !');
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

  // Barre de navigation inférieure
  const BottomNav = () => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100 }}>
      <button onClick={() => setView('pharmacy')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: view === 'pharmacy' ? '#48bb78' : '#718096', fontSize: '12px', fontWeight: '600' }}>
        <Home />Pharmacie
      </button>
      <button onClick={() => setView('parents')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: view === 'parents' ? '#667eea' : '#718096', fontSize: '12px', fontWeight: '600' }}>
        <Users />Parents
      </button>
      <button onClick={() => setView('children')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: view === 'children' ? '#ffd93d' : '#718096', fontSize: '12px', fontWeight: '600' }}>
        <Baby />Enfants
      </button>
      <button onClick={() => setView('addPerson')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: view === 'addPerson' ? '#764ba2' : '#718096', fontSize: '12px', fontWeight: '600' }}>
        <UserPlus />Ajouter
      </button>
    </div>
  );

  // ─── RENDU DES VUES EN FONCTION DE L'ÉTAT ──────────────────────────────────
  if (view === 'pharmacy') {
    const expired = homePharmacy.filter(item => isExpired(item.expiryDate));
    const expiringSoon = homePharmacy.filter(item => isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate));
    const lowStock = homePharmacy.filter(item => item.quantity <= 5);
    
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', padding: '32px 20px', color: 'white' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>🏠 Pharmacie Familiale</h1>
          <p style={{ opacity: 0.9, fontSize: '16px' }}>{homePharmacy.length} médicaments enregistrés</p>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Panneau d'alertes */}
          {(expired.length > 0 || expiringSoon.length > 0 || lowStock.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              {expired.length > 0 && (
                <div style={{ background: '#fff5f5', border: '2px solid #fc8181', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#c53030' }}>
                  <AlertCircle style={{ color: '#e53e3e' }} />
                  <div><strong>{expired.length} produit(s) expiré(s)</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>À déposer en pharmacie (Cyclamed).</p></div>
                </div>
              )}
              {expiringSoon.length > 0 && (
                <div style={{ background: '#fffaf0', border: '2px solid #f6ad55', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', color: '#c05621' }}>
                  <AlertCircle style={{ color: '#dd6b20' }} />
                  <div><strong>{expiringSoon.length} produit(s) en fin de validité</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Expiration dans les 90 jours.</p></div>
                </div>
              )}
              {lowStock.length > 0 && (
                <div style={{ background: '#ebf8ff', border: '2px solid #90cdf4', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', color: '#2c5282' }}>
                  <AlertCircle style={{ color: '#3182ce' }} />
                  <div><strong>{lowStock.length} rupture(s) de stock proche(s)</strong><p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>Seuils critiques inférieurs à 5 unités.</p></div>
                </div>
              )}
            </div>
          )}

          {/* Grille Médicaments */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {homePharmacy.map(item => {
              const hasExpired = isExpired(item.expiryDate);
              const willExpire = isExpiringSoon(item.expiryDate);
              const isLow = item.quantity <= 5;
              
              return (
                <div key={item.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', opacity: hasExpired ? 0.6 : 1, border: hasExpired ? '2px solid #fc8181' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '36px' }}>{item.image}</div>
                    <button onClick={() => removePharmacyItem(item.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#fee', color: '#e53e3e', cursor: 'pointer' }}>×</button>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#2d3748', marginBottom: '6px' }}>{item.name}</h3>
                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>{item.dosages.join(', ')}</div>
                  <div style={{ fontSize: '11px', background: '#edf2f7', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '12px' }}>{item.category}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updatePharmacyQuantity(item.id, -1)} disabled={item.quantity === 0} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #48bb78', background: 'white', color: '#48bb78', cursor: 'pointer', fontWeight: '700' }}>-</button>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: isLow ? '#e53e3e' : '#2d3748', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updatePharmacyQuantity(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #48bb78', background: 'white', color: '#48bb78', cursor: 'pointer', fontWeight: '700' }}>+</button>
                    </div>
                    <div style={{ fontSize: '11px', color: hasExpired ? '#e53e3e' : willExpire ? '#d69e2e' : '#718096', fontWeight: '600' }}>
                      {new Date(item.expiryDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <BottomNav />
        {showNotification && (
          <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#48bb78', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1000 }}>{notificationMessage}</div>
        )}
      </div>
    );
  }

  if (view === 'parents') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '32px 20px', color: 'white' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>👨‍👩 Parents</h1>
          <p style={{ opacity: 0.9 }}>Suivi médical adulte</p>
        </div>

        <div style={{ padding: '20px' }}>
          {parents.map(parent => {
            const meds = medications[parent.id] || [];
            const weekDates = getWeekDates(currentWeekOffset);
            const today = new Date().toISOString().split('T')[0];
            
            return (
              <div key={parent.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderLeft: `4px solid ${parent.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px' }}>{parent.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>{parent.name}</h2>
                    <p style={{ fontSize: '14px', color: '#718096' }}>{meds.length} traitement(s)</p>
                  </div>
                  <button onClick={() => { setSelectedPerson(parent.id); setView('scan'); }} style={{ background: parent.color, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus />Scanner
                  </button>
                </div>

                {meds.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>📅 Suivi d'observance</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)} style={{ width: '32px', height: '32px', border: 'none', background: '#f7fafc', cursor: 'pointer' }}><ChevronLeft /></button>
                          {currentWeekOffset !== 0 && <button onClick={() => setCurrentWeekOffset(0)} style={{ padding: '6px 12px', border: 'none', background: '#667eea', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Aujourd'hui</button>}
                          <button onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)} style={{ width: '32px', height: '32px', border: 'none', background: '#f7fafc', cursor: 'pointer' }}><ChevronRight /></button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {weekDates.map(date => {
                          const dateStr = date.toISOString().split('T')[0];
                          const isToday = dateStr === today;
                          const dayMeds = meds.filter(med => date <= new Date(med.endDate)).flatMap(med => med.times.map(time => ({ ...med, time, taken: med.taken?.[`${dateStr}-${time}`] || false })));
                          return (
                            <div key={dateStr} style={{ background: isToday ? parent.color : '#f7fafc', color: isToday ? 'white' : '#2d3748', borderRadius: '12px', padding: '8px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: '600', opacity: 0.8 }}>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0' }}>{date.getDate()}</div>
                              {dayMeds.length > 0 && <div style={{ fontSize: '10px' }}>{dayMeds.filter(m => m.taken).length}/{dayMeds.length}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      {meds.map(med => (
                        <div key={med.id} style={{ background: '#f7fafc', borderRadius: '12px', padding: '12px', marginBottom: '8px', borderLeft: `3px solid ${parent.color}` }}>
                          <div style={{ fontWeight: '600' }}>{med.name}</div>
                          <div style={{ fontSize: '13px', color: '#718096' }}>{med.dosage} • {med.times.length} prise(s)/j</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {med.times.map(time => <span key={time} style={{ background: parent.color, color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>{time}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#a0aec0' }}><Pill style={{ width: '42px', margin: '0 auto 12px' }} /><p>Aucune ordonnance active.</p></div>
                )}
              </div>
            );
          })}
        </div>

        <BottomNav />
      </div>
    );
  }

  if (view === 'children') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #ffd93d 0%, #ffb347 100%)', padding: '32px 20px', color: 'white' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>👶 Enfants</h1>
          <p style={{ opacity: 0.9 }}>Posologies pédiatriques</p>
        </div>

        <div style={{ padding: '20px' }}>
          {children.map(child => {
            const meds = medications[child.id] || [];
            return (
              <div key={child.id} style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderLeft: `4px solid ${child.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px' }}>{child.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{child.name}</h2>
                    <p style={{ fontSize: '14px', color: '#718096' }}>{child.age} ans • {meds.length} posologie(s)</p>
                  </div>
                  <button onClick={() => { setSelectedPerson(child.id); setView('scan'); }} style={{ background: child.color, color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>
                    <Plus />Scanner
                  </button>
                </div>

                {meds.length > 0 ? (
                  <div>
                    {meds.map(med => (
                      <div key={med.id} style={{ background: '#f7fafc', borderRadius: '12px', padding: '12px', marginBottom: '8px', borderLeft: `3px solid ${child.color}` }}>
                        <div style={{ fontWeight: '600' }}>{med.name}</div>
                        <div style={{ fontSize: '13px', color: '#718096' }}>{med.dosage}</div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {med.times.map(time => <span key={time} style={{ background: child.color, color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>{time}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#a0aec0' }}><Pill style={{ width: '42px', margin: '0 auto 12px' }} /><p>Traitement vide.</p></div>
                )}
              </div>
            );
          })}
        </div>

        <BottomNav />
      </div>
    );
  }

  if (view === 'addPerson') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
        <div style={{ background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', padding: '32px 20px', color: 'white' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800' }}>➕ Profil Familial</h1>
        </div>

        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Rôle</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setNewPerson({ ...newPerson, type: 'parent' })} style={{ flex: 1, padding: '16px', border: `2px solid ${newPerson.type === 'parent' ? '#667eea' : '#e2e8f0'}`, background: newPerson.type === 'parent' ? '#eef2ff' : 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>👨‍👩 Parent</button>
                <button onClick={() => setNewPerson({ ...newPerson, type: 'child' })} style={{ flex: 1, padding: '16px', border: `2px solid ${newPerson.type === 'child' ? '#ffd93d' : '#e2e8f0'}`, background: newPerson.type === 'child' ? '#fffbeb' : 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>👶 Enfant</button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Identité</label>
              <input type="text" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} placeholder="Prénom Nom" style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px' }} />
            </div>

            {newPerson.type === 'child' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Âge</label>
                <input type="number" value={newPerson.age} onChange={(e) => setNewPerson({ ...newPerson, age: e.target.value })} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {(newPerson.type === 'parent' ? ['👨', '👩', '🧑', '👴', '👵'] : ['👦', '👧', '🧒', '👶', '🍼']).map(emoji => (
                  <button key={emoji} onClick={() => setNewPerson({ ...newPerson, avatar: emoji })} style={{ padding: '16px', fontSize: '32px', border: `2px solid ${newPerson.avatar === emoji ? '#667eea' : '#e2e8f0'}`, background: 'white', borderRadius: '12px', cursor: 'pointer' }}>{emoji}</button>
                ))}
              </div>
            </div>

            <button onClick={addPerson} disabled={!newPerson.name} style={{ width: '100%', padding: '16px', background: newPerson.name ? '#764ba2' : '#cbd5e0', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' }}>✓ Ajouter à la famille</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (view === 'scan') {
    const person = [...parents, ...children].find(p => p.id === selectedPerson);
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div style={{ background: `linear-gradient(135deg, ${person.color} 0%, #2d3748 100%)`, padding: '20px', color: 'white' }}>
          <button onClick={() => setView(person.type === 'parent' ? 'parents' : 'children')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px' }}>← Retour</button>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Scanner une ordonnance</h2>
          <p style={{ opacity: 0.9 }}>Dossier de : {person.name}</p>
        </div>

        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!scanFile ? (
              <>
                <input type="file" id="scan-input" accept="image/*" onChange={handleScanUpload} style={{ display: 'none' }} />
                <label htmlFor="scan-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '64px' }}>📄</div>
                  <h3 style={{ fontSize: '22px', fontWeight: '700' }}>Importer la prescription</h3>
                  <div style={{ background: person.color, color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: '600' }}>Sélectionner la photo</div>
                </label>
              </>
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={scanFile} style={{ width: '100%', borderRadius: '12px' }} />
                {isProcessing && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45, 55, 72, 0.95)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Analyse OCR intelligente...</h3>
                    <div style={{ width: '80%', height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', marginBottom: '12px' }}>
                      <div style={{ height: '100%', background: '#48bb78', width: `${ocrProgress}%`, borderRadius: '10px' }} />
                    </div>
                    <p style={{ fontSize: '14px' }}>{ocrStatus}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'addMed') {
    const person = [...parents, ...children].find(p => p.id === selectedPerson);
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div style={{ background: `linear-gradient(135deg, ${person.color} 0%, #2d3748 100%)`, padding: '20px', color: 'white' }}>
          <button onClick={() => setView('scan')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px' }}>← Rallumer l'appareil</button>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Vérification Posologique</h2>
        </div>

        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            {detectedMedications.length > 0 && (
              <div style={{ padding: '12px', background: '#f0fff4', border: '2px solid #48bb78', borderRadius: '12px', marginBottom: '20px', color: '#22543d', fontSize: '14px' }}>
                <strong>BDPM Validé :</strong> Libellé moléculaire certifié par l'ANSM.
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Médicament certifié</label>
              <input type="text" value={newMedication.name} onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Grammage / Unité</label>
              <input type="text" value={newMedication.dosage} onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Horaires de notification</label>
              {newMedication.times.map((time, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="time" value={time} onChange={(e) => { const newTimes = [...newMedication.times]; newTimes[idx] = e.target.value; setNewMedication({ ...newMedication, times: newTimes }); }} style={{ flex: 1, padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
                  {newMedication.times.length > 1 && <button onClick={() => { const newTimes = newMedication.times.filter((_, i) => i !== idx); setNewMedication({ ...newMedication, times: newTimes }); }} style={{ width: '48px', border: '2px solid #fc8181', background: 'white', color: '#fc8181', borderRadius: '12px', cursor: 'pointer' }}>×</button>}
                </div>
              ))}
              <button onClick={() => setNewMedication({ ...newMedication, times: [...newMedication.times, ''] })} style={{ width: '100%', padding: '12px', background: '#edf2f7', border: '2px dashed #cbd5e0', borderRadius: '12px', cursor: 'pointer' }}>+ Ajouter une prise</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Fin de la prescription</label>
              <input type="date" value={newMedication.endDate} onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })} style={{ width: '100%', padding: '14px', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
            </div>

            <button onClick={addMedication} disabled={!newMedication.name || !newMedication.dosage} style={{ width: '100%', padding: '16px', background: newMedication.name && newMedication.dosage ? person.color : '#cbd5e0', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer' }}>✓ Ajouter au traitement</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Rendu dans l'arbre DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MedicationApp />);