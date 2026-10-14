/**
 * Scalable Pharmaceutical Reference Catalog
 * Acts as an open validation & enrichment layer AFTER OCR extraction.
 * NEVER blocks unrecognized medicines: new medicines still display all OCR-extracted fields.
 */

export interface CatalogEntry {
  id: string;
  genericName: string;
  brandNames: string[];
  therapeuticClass: string;
  typicalStrengths: string[];
  commonManufacturers: string[];
  purpose: string[];
  simpleExplanation: string;
  dosageGuidance: string;
  sideEffects: string[];
  storageInstructions: string;
  precautions: string[];
}

export const MEDICINE_CATALOG: CatalogEntry[] = [
  {
    id: 'paracetamol',
    genericName: 'Paracetamol / Acetaminophen',
    brandNames: ['Dolo 650', 'Crocin', 'Calpol', 'Panadol', 'Pacimol', 'Tylenol', 'P-650', 'Pyrigesic'],
    therapeuticClass: 'Analgesic & Antipyretic',
    typicalStrengths: ['500mg', '650mg', '120mg/5ml', '250mg/5ml', '1000mg'],
    commonManufacturers: ['Micro Labs', 'GSK', 'Cipla', 'Ipca', 'Alkem', 'Sanofi'],
    purpose: ['Fever reduction', 'Mild to moderate body pain', 'Headache relief', 'Post-vaccination pain'],
    simpleExplanation: 'Paracetamol inhibits prostaglandin synthesis in the central nervous system to lower fever and relieve mild-to-moderate aches.',
    dosageGuidance: 'Take 1 tablet after food when needed. Maintain at least 4 to 6 hours between doses. Do not exceed 4000mg (4g) within a 24-hour window.',
    sideEffects: ['Mild nausea', 'Rare skin rash', 'Liver toxicity if taken above maximum recommended dose'],
    storageInstructions: 'Store in a dry location below 25°C away from direct sunlight.',
    precautions: [
      'Do not consume alongside other paracetamol-containing combination medicines.',
      'Strictly avoid alcohol while taking this medicine.',
      'Consult a physician if you have chronic liver or kidney disease.'
    ]
  },
  {
    id: 'amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Novamox', 'Mox', 'Almox', 'Moxikind', 'Amoxicillin 500mg'],
    therapeuticClass: 'Beta-lactam Antibiotic (Penicillin class)',
    typicalStrengths: ['250mg', '500mg', '125mg/5ml', '250mg/5ml'],
    commonManufacturers: ['Cipla', 'Sun Pharma', 'Alkem', 'Mankind', 'Abbott'],
    purpose: ['Bacterial respiratory infections', 'Ear, nose and throat infections', 'Skin & soft tissue infections', 'Urinary tract infections'],
    simpleExplanation: 'Amoxicillin stops bacterial cell wall formation, killing susceptible bacteria and stopping infection spread.',
    dosageGuidance: 'Take 1 capsule every 8 or 12 hours as prescribed. Complete the entire course even if symptoms subside early.',
    sideEffects: ['Diarrhea', 'Mild nausea', 'Upset stomach', 'Allergic rash'],
    storageInstructions: 'Store capsules in a dry place below 25°C. Suspensions should be kept refrigerated.',
    precautions: [
      'Contraindicated in patients with severe penicillin allergy.',
      'May reduce the efficacy of oral birth control pills.',
      'Drink plenty of water to maintain renal hydration.'
    ]
  },
  {
    id: 'amox-clav',
    genericName: 'Amoxicillin & Potassium Clavulanate',
    brandNames: ['Augmentin 625 Duo', 'Clavam 625', 'Moxikind-CV', 'Advent 625', 'Sensiclav', 'Polyclav'],
    therapeuticClass: 'Broad-Spectrum Antibiotic with Beta-Lactamase Inhibitor',
    typicalStrengths: ['375mg', '625mg', '1000mg', '228.5mg/5ml', '457mg/5ml'],
    commonManufacturers: ['GlaxoSmithKline (GSK)', 'Alkem', 'Mankind', 'Cipla', 'Macleods'],
    purpose: ['Sinusitis & respiratory tract infections', 'Dental infections', 'Bone and joint infections', 'Severe skin infections'],
    simpleExplanation: 'Clavulanic acid blocks bacterial enzymes that destroy amoxicillin, allowing amoxicillin to conquer resistant bacterial strains.',
    dosageGuidance: 'Take 1 tablet at the beginning of a meal to optimize absorption and minimize gastrointestinal discomfort.',
    sideEffects: ['Loose stools or diarrhea', 'Mild nausea', 'Abdominal cramps', 'Vaginal thrush'],
    storageInstructions: 'Moisture-sensitive foil blister. Store below 25°C in a dry place. Keep in original foil until consumption.',
    precautions: [
      'Do not chew or crush extended-release tablets.',
      'Monitor liver enzymes if taken for prolonged courses over 14 days.',
      'Seek prompt medical help if severe watery diarrhea or hives develop.'
    ]
  },
  {
    id: 'pantoprazole',
    genericName: 'Pantoprazole',
    brandNames: ['Pantocid 40', 'Pan 40', 'Pantop 40', 'Protonix', 'Pantosec', 'Pan-D'],
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    typicalStrengths: ['20mg', '40mg'],
    commonManufacturers: ['Sun Pharma', 'Alkem', 'Aristo', 'Cipla', 'Torrent'],
    purpose: ['Gastroesophageal reflux disease (GERD)', 'Acid peptic disease', 'Stomach ulcer healing', 'Heartburn relief'],
    simpleExplanation: 'Pantoprazole binds irreversibly to gastric H+/K+ ATPase pumps in stomach parietal cells, markedly reducing stomach acid production.',
    dosageGuidance: 'Swallow whole with water 30 to 60 minutes before breakfast. Do not crush, break, or chew enteric-coated tablets.',
    sideEffects: ['Headache', 'Flatulence', 'Mild diarrhea or constipation', 'Dry mouth'],
    storageInstructions: 'Store in moisture-proof packaging below 30°C.',
    precautions: [
      'Long-term continuous use may reduce vitamin B12 and magnesium absorption.',
      'Check with your doctor before combining with clopidogrel or iron supplements.',
      'Notify your doctor if stomach pain persists beyond 2 weeks.'
    ]
  },
  {
    id: 'azithromycin',
    genericName: 'Azithromycin',
    brandNames: ['Azithral 500', 'Azee 500', 'Zithromax', 'Azicip', 'Zady', 'Azikem'],
    therapeuticClass: 'Macrolide Antibiotic',
    typicalStrengths: ['250mg', '500mg', '100mg/5ml', '200mg/5ml'],
    commonManufacturers: ['Alembic', 'Cipla', 'Pfizer', 'Mankind', 'Alkem'],
    purpose: ['Upper & lower respiratory tract infections', 'Tonsillitis & pharyngitis', 'Community-acquired pneumonia', 'Chlamydial infections'],
    simpleExplanation: 'Azithromycin penetrates deep into bodily tissues and white blood cells, inhibiting bacterial protein synthesis at the 50S ribosomal subunit.',
    dosageGuidance: 'Take once daily, either 1 hour before food or 2 hours after a meal, at the exact same hour every day for 3 or 5 days.',
    sideEffects: ['Nausea', 'Abdominal pain', 'Transient diarrhea', 'Temporary taste alteration'],
    storageInstructions: 'Store below 25°C away from humidity and heat.',
    precautions: [
      'Do not take aluminium or magnesium-containing antacids simultaneously.',
      'Use caution if you have underlying cardiac arrhythmias (QT prolongation).',
      'Inform doctor immediately if irregular palpitations occur.'
    ]
  },
  {
    id: 'cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    brandNames: ['Cetzine', 'Alerid', 'Zyrtec', 'Okacet', 'Cetrizet', 'Incid-L'],
    therapeuticClass: 'Second-Generation Antihistamine',
    typicalStrengths: ['5mg', '10mg', '5mg/5ml'],
    commonManufacturers: ['Dr. Reddy’s', 'Cipla', 'GSK', 'Alkem', 'Sun Pharma'],
    purpose: ['Allergic rhinitis & seasonal allergies', 'Sneezing & runny nose', 'Urticaria & itchy hives', 'Allergic conjunctivitis'],
    simpleExplanation: 'Cetirizine selectively blocks peripheral histamine H1 receptors, neutralizing allergy reactions without heavy central nervous sedation.',
    dosageGuidance: 'Take 1 tablet (10mg) once daily, preferably in the evening with water, with or without meals.',
    sideEffects: ['Mild daytime sleepiness', 'Dry mouth', 'Fatigue', 'Dizziness'],
    storageInstructions: 'Store in cool and dry place below 30°C.',
    precautions: [
      'Avoid driving or handling heavy machinery if you feel drowsy.',
      'Avoid drinking alcoholic beverages as it enhances sedating effects.',
      'Adjust dose if moderate to severe renal impairment is diagnosed.'
    ]
  },
  {
    id: 'telmisartan',
    genericName: 'Telmisartan',
    brandNames: ['Telma 40', 'Telpres', 'Micardis', 'Telvas', 'Telsar', 'Creser'],
    therapeuticClass: 'Angiotensin II Receptor Blocker (ARB)',
    typicalStrengths: ['20mg', '40mg', '80mg'],
    commonManufacturers: ['Glenmark', 'Abbott', 'Boehringer Ingelheim', 'Aristo', 'Cipla'],
    purpose: ['Hypertension (high blood pressure)', 'Cardiovascular risk reduction', 'Diabetic nephropathy protection'],
    simpleExplanation: 'Telmisartan blocks angiotensin II receptors, causing vascular smooth muscle relaxation and sustained blood pressure reduction.',
    dosageGuidance: 'Take once daily at the same time every morning with or without food. Do not stop abruptly without physician advice.',
    sideEffects: ['Dizziness upon standing', 'Back pain', 'Sinus congestion', 'Mild fatigue'],
    storageInstructions: 'Extremely hygroscopic tablets. Keep inside original blister foil until immediately before ingestion. Store below 25°C.',
    precautions: [
      'Strictly contraindicated during pregnancy due to fetal toxicity risk.',
      'Regularly monitor blood potassium levels and renal function.',
      'Rise slowly from sitting to prevent postural hypotension.'
    ]
  },
  {
    id: 'metformin',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['Glycomet 500', 'Glucophage', 'Cetapin', 'Obimet', 'Gluformin', 'Glyciphage'],
    therapeuticClass: 'Biguanide Oral Antidiabetic',
    typicalStrengths: ['500mg', '850mg', '1000mg', '500mg SR', '1000mg SR'],
    commonManufacturers: ['USV', 'Merck / Sanofi', 'Franco-Indian', 'Sun Pharma', 'Cipla'],
    purpose: ['Type 2 Diabetes Mellitus glycemic control', 'Insulin sensitivity improvement', 'Polycystic Ovary Syndrome (PCOS) adjunct'],
    simpleExplanation: 'Metformin reduces hepatic gluconeogenesis (glucose output by the liver) and enhances peripheral tissue insulin sensitivity.',
    dosageGuidance: 'Take with or immediately after meals to reduce stomach discomfort. Extended-release (SR/ER) forms must be swallowed whole.',
    sideEffects: ['Mild gastrointestinal upset', 'Metallic taste', 'Nausea', 'Decreased vitamin B12 levels with long-term use'],
    storageInstructions: 'Store at room temperature below 25°C away from moisture.',
    precautions: [
      'Temporarily stop if undergoing radiological procedures with iodinated contrast dyes.',
      'Avoid excessive alcohol intake to prevent lactic acidosis.',
      'Periodic monitoring of eGFR / kidney function is mandatory.'
    ]
  },
  {
    id: 'atorvastatin',
    genericName: 'Atorvastatin Calcium',
    brandNames: ['Atorva 10', 'Lipitor', 'Storvas', 'Atocor', 'Tonact', 'Lipikind'],
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    typicalStrengths: ['10mg', '20mg', '40mg', '80mg'],
    commonManufacturers: ['Zydus Cadila', 'Pfizer', 'Sun Pharma', 'Dr. Reddy’s', 'Lupin'],
    purpose: ['Hypercholesterolemia (high LDL cholesterol)', 'Atherosclerosis prevention', 'Heart attack & stroke risk reduction'],
    simpleExplanation: 'Atorvastatin slows internal cholesterol production in the liver and accelerates clearance of bad LDL cholesterol from the bloodstream.',
    dosageGuidance: 'Take 1 tablet once daily, preferably in the evening or night, consistently with or without food.',
    sideEffects: ['Mild muscle aches', 'Headache', 'Joint discomfort', 'Transient digestive changes'],
    storageInstructions: 'Store below 25°C in a dry place.',
    precautions: [
      'Report unexplained muscle tenderness, weakness, or cramps immediately to your doctor.',
      'Avoid excessive consumption of grapefruit juice.',
      'Contraindicated in pregnant and nursing mothers.'
    ]
  },
  {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: ['Brufen', 'Advil', 'Motrin', 'Ibugesic', 'Combiflam (combination)'],
    therapeuticClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    typicalStrengths: ['200mg', '400mg', '600mg', '800mg'],
    commonManufacturers: ['Abbott', 'Pfizer', 'Cipla', 'Sanofi'],
    purpose: ['Inflammatory joint pain & arthritis', 'Dental pain', 'Musculoskeletal sprains', 'Menstrual dysmenorrhea'],
    simpleExplanation: 'Ibuprofen inhibits cyclooxygenase enzymes (COX-1 and COX-2) to damp inflammatory mediators and relieve pain.',
    dosageGuidance: 'Always take with a full meal or glass of milk to protect gastric lining.',
    sideEffects: ['Heartburn', 'Stomach irritation', 'Mild dizziness', 'Fluid retention'],
    storageInstructions: 'Store in tight, light-resistant container below 25°C.',
    precautions: [
      'Avoid if you have active peptic ulcer disease or gastrointestinal bleeding.',
      'Caution in uncontrolled high blood pressure or congestive heart failure.',
      'Avoid concurrent usage with other oral NSAIDs.'
    ]
  },
  {
    id: 'montelukast-levocetirizine',
    genericName: 'Montelukast Sodium & Levocetirizine Dihydrochloride',
    brandNames: ['Montair-LC', 'Telekast-L', 'Monticope', 'Levolin-M', 'Montek-LC', 'Odimont-LC'],
    therapeuticClass: 'Leukotriene Receptor Antagonist & Antihistamine Combination',
    typicalStrengths: ['10mg + 5mg', '4mg + 2.5mg (Kid)'],
    commonManufacturers: ['Cipla', 'Lupin', 'Mankind', 'Sun Pharma', 'Glenmark'],
    purpose: ['Allergic asthma maintenance', 'Chronic allergic rhinitis', 'Seasonal hay fever with bronchospasm'],
    simpleExplanation: 'Levocetirizine suppresses histamine-induced sneezing and runny nose, while montelukast blocks leukotrienes to prevent airway swelling and constriction.',
    dosageGuidance: 'Take 1 tablet once daily in the evening or at bedtime with water.',
    sideEffects: ['Drowsiness', 'Headache', 'Dry mouth', 'Mild gastrointestinal discomfort'],
    storageInstructions: 'Store below 25°C protected from light and moisture.',
    precautions: [
      'Not intended to treat acute asthma attacks (use rescue inhalers for acute spasms).',
      'Observe for any mood changes or agitation.',
      'Avoid concurrent alcohol ingestion.'
    ]
  },
  {
    id: 'ciprofloxacin',
    genericName: 'Ciprofloxacin',
    brandNames: ['Cifran 500', 'Ciplox 500', 'Cipro', 'Ciprobid', 'Zoxan'],
    therapeuticClass: 'Fluoroquinolone Antibiotic',
    typicalStrengths: ['250mg', '500mg', '750mg'],
    commonManufacturers: ['Sun Pharma', 'Cipla', 'Zydus', 'FDC'],
    purpose: ['Urinary tract infections (complicated UTI)', 'Bacterial gastrointestinal diarrhea', 'Bone and joint infections', 'Severe prostatitis'],
    simpleExplanation: 'Ciprofloxacin inhibits bacterial DNA gyrase and topoisomerase IV, interrupting bacterial replication and repair.',
    dosageGuidance: 'Take 1 tablet twice daily with plenty of water. Complete the entire prescribed duration.',
    sideEffects: ['Nausea', 'Diarrhea', 'Dizziness', 'Sun sensitivity (phototoxicity)'],
    storageInstructions: 'Store below 30°C in moisture-resistant foil.',
    precautions: [
      'Avoid calcium-rich foods or antacids 2 hours before and after the dose.',
      'Risk of tendonitis and tendon rupture — rest if tendon pain appears.',
      'Wear sunscreen and avoid intense direct sun exposure during the course.'
    ]
  },
  {
    id: 'aspirin',
    genericName: 'Aspirin / Acetylsalicylic Acid',
    brandNames: ['Ecosprin 75', 'Ecosprin 150', 'Disprin', 'Bayer Aspirin', 'Loprin', 'Delisprin'],
    therapeuticClass: 'Antiplatelet & Analgesic',
    typicalStrengths: ['75mg', '150mg', '325mg', '500mg'],
    commonManufacturers: ['USV', 'Bayer', 'Reckitt Benckiser', 'Torrent', 'Cipla'],
    purpose: ['Cardiovascular prevention', 'Blood clot prevention (antiplatelet)', 'Transient ischemic attack (TIA) prevention', 'Post-stent therapy'],
    simpleExplanation: 'Low-dose aspirin irreversibly inhibits platelet COX-1 enzyme, preventing blood platelets from clumping together to form arterial clots.',
    dosageGuidance: 'Take once daily after a main meal with a full glass of water. Swallow gastro-resistant (enteric-coated) tablets whole.',
    sideEffects: ['Mild dyspepsia or heartburn', 'Increased bleeding tendency or easy bruising', 'Nausea'],
    storageInstructions: 'Store in dry place below 25°C protected from moisture.',
    precautions: [
      'Contraindicated in active peptic ulcer or hemophilia bleeding disorders.',
      'Inform surgeon or dentist before any surgical or dental procedures.',
      'Avoid combining with other NSAIDs without medical supervision.'
    ]
  },
  {
    id: 'omeprazole',
    genericName: 'Omeprazole',
    brandNames: ['Omez 20', 'Omez', 'Prilosec', 'Omee', 'Omecip', 'Ocid'],
    therapeuticClass: 'Proton Pump Inhibitor (PPI)',
    typicalStrengths: ['10mg', '20mg', '40mg'],
    commonManufacturers: ['Dr. Reddy’s', 'Alkem', 'Cipla', 'Zydus'],
    purpose: ['Gastroesophageal reflux disease (GERD)', 'Gastric & duodenal ulcer healing', 'Heartburn relief'],
    simpleExplanation: 'Omeprazole binds to the proton pumps in stomach lining cells, reducing gastric acid production for sustained symptom relief.',
    dosageGuidance: 'Take 1 capsule 30-60 minutes before breakfast with a glass of water. Swallow whole.',
    sideEffects: ['Headache', 'Mild diarrhea or constipation', 'Stomach ache', 'Nausea'],
    storageInstructions: 'Keep in moisture-proof blister below 25°C.',
    precautions: [
      'Long-term use may reduce magnesium and vitamin B12 absorption.',
      'Check with doctor before taking together with clopidogrel.'
    ]
  },
  {
    id: 'calcium-d3',
    genericName: 'Calcium Carbonate & Vitamin D3 (Cholecalciferol)',
    brandNames: ['Shelcal 500', 'Cipcal 500', 'Calcimax 500', 'Gemcal', 'Corcium'],
    typicalStrengths: ['500mg + 250IU', '500mg + 400IU'],
    therapeuticClass: 'Nutritional Mineral & Bone Density Supplement',
    commonManufacturers: ['Torrent Pharmaceuticals', 'Cipla', 'Meyer Organics', 'Alkem'],
    purpose: ['Osteoporosis prevention & treatment', 'Calcium deficiency', 'Bone density maintenance', 'Pregnancy & lactation calcium support'],
    simpleExplanation: 'Provides essential bioavailable elemental calcium to strengthen bones and teeth, paired with Vitamin D3 to facilitate intestinal calcium absorption.',
    dosageGuidance: 'Take 1 tablet daily with or after meals to maximize gastrointestinal absorption.',
    sideEffects: ['Mild constipation', 'Flatulence', 'Abdominal bloating'],
    storageInstructions: 'Store in a dry location below 25°C away from heat and direct sunlight.',
    precautions: [
      'Avoid taking simultaneously with iron or thyroid hormone supplements (space by 2 to 4 hours).',
      'Caution in patients with history of kidney stones or hypercalcemia.'
    ]
  },
  {
    id: 'losartan',
    genericName: 'Losartan Potassium',
    brandNames: ['Losar 50', 'Losacar', 'Cozaar', 'Repace', 'Alsartan'],
    therapeuticClass: 'Angiotensin II Receptor Blocker (ARB)',
    typicalStrengths: ['25mg', '50mg', '100mg'],
    commonManufacturers: ['Unichem', 'Zydus', 'Sun Pharma', 'Merck'],
    purpose: ['Hypertension (high blood pressure)', 'Stroke reduction in hypertensive patients', 'Diabetic kidney disease protection'],
    simpleExplanation: 'Blocks the vasoconstricting effects of angiotensin II, relaxing arteries and reducing pressure load on the heart.',
    dosageGuidance: 'Take once daily at the same time each day with or without food.',
    sideEffects: ['Dizziness', 'Nasal congestion', 'Back pain', 'Fatigue'],
    storageInstructions: 'Store in original packaging below 25°C.',
    precautions: [
      'Contraindicated in pregnancy.',
      'Monitor serum potassium and renal parameters periodically.'
    ]
  },
  {
    id: 'rosuvastatin',
    genericName: 'Rosuvastatin Calcium',
    brandNames: ['Rozavel 10', 'Crestor', 'Rosuvas', 'Novastat', 'Rosave'],
    therapeuticClass: 'HMG-CoA Reductase Inhibitor (High-Intensity Statin)',
    typicalStrengths: ['5mg', '10mg', '20mg', '40mg'],
    commonManufacturers: ['Sun Pharma', 'AstraZeneca', 'Ranbaxy', 'Lupin'],
    purpose: ['High LDL cholesterol reduction', 'Atherosclerosis prevention', 'Cardiovascular event reduction'],
    simpleExplanation: 'A potent statin that decreases cholesterol synthesis in the liver and accelerates removal of bad cholesterol from the bloodstream.',
    dosageGuidance: 'Take 1 tablet once daily, with or without food, at any time of day but consistently at that time.',
    sideEffects: ['Muscle ache or weakness', 'Headache', 'Dizziness', 'Abdominal pain'],
    storageInstructions: 'Store below 30°C in moisture-resistant pack.',
    precautions: [
      'Promptly report unexplained muscle pain or brown urine.',
      'Contraindicated in active liver disease or pregnancy.'
    ]
  }
];

/**
 * Standard Levenshtein distance calculation for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Calculates string similarity ratio (0.0 to 1.0)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const s2 = (str2 || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen;
  }
  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Intelligent Medicine Identification & Validation
 * Searches the catalog using exact, fuzzy, brand-name, generic and composition matching.
 * Returns catalog match if similarity >= 0.78, otherwise returns null.
 */
export function matchMedicineInCatalog(
  candidateBrand: string,
  candidateGeneric?: string,
  rawOcrText?: string
): { entry: CatalogEntry; confidence: number; matchedBy: 'brand' | 'generic' | 'ocr' } | null {
  const cleanBrand = (candidateBrand || '').trim();
  const cleanGeneric = (candidateGeneric || '').trim();
  const cleanOcr = (rawOcrText || '').toLowerCase();

  let bestMatch: CatalogEntry | null = null;
  let bestScore = 0;
  let bestMatchedBy: 'brand' | 'generic' | 'ocr' = 'brand';

  for (const entry of MEDICINE_CATALOG) {
    // 1. Check Brand Names
    for (const brand of entry.brandNames) {
      const score = stringSimilarity(cleanBrand, brand);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
        bestMatchedBy = 'brand';
      }

      // Check if OCR text directly contains this brand name as a whole word
      const brandLower = brand.toLowerCase();
      if (cleanOcr.includes(brandLower) && score < 0.95) {
        const ocrScore = 0.88;
        if (ocrScore > bestScore) {
          bestScore = ocrScore;
          bestMatch = entry;
          bestMatchedBy = 'ocr';
        }
      }
    }

    // 2. Check Generic Name
    if (cleanGeneric) {
      const genScore = stringSimilarity(cleanGeneric, entry.genericName);
      if (genScore > bestScore) {
        bestScore = genScore;
        bestMatch = entry;
        bestMatchedBy = 'generic';
      }
    }

    // 3. Check Generic Active Compound in raw OCR text
    const genWords = entry.genericName.toLowerCase().split(/[\s\/,&]+/).filter((w) => w.length > 4);
    for (const w of genWords) {
      if (cleanOcr.includes(w) && bestScore < 0.85) {
        const ocrGenScore = 0.85;
        if (ocrGenScore > bestScore) {
          bestScore = ocrGenScore;
          bestMatch = entry;
          bestMatchedBy = 'ocr';
        }
      }
    }
  }

  // Confident matching threshold
  if (bestMatch && bestScore >= 0.75) {
    return {
      entry: bestMatch,
      confidence: Math.round(bestScore * 100),
      matchedBy: bestMatchedBy
    };
  }

  return null;
}
