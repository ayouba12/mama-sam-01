import { AllergenKey, AllergenPresence, AllergenRecords, ProductDietaryInfo } from '../types';

export interface AllergenMeta {
  key: AllergenKey;
  label: string;
  shortLabel: string;
  euRegulation: string;
  description: string;
  hasDetailInput: boolean;
  detailPlaceholder?: string;
  commonExamples?: string[];
}

export const EU_ALLERGENS: AllergenMeta[] = [
  {
    key: 'cereals_gluten',
    label: 'Cereali contenenti glutine',
    shortLabel: 'Glutine / Cereali',
    euRegulation: 'Reg. UE 1169/2011, All. II (1)',
    description: 'Grano (incluso farro e grano khorasan), segale, orzo, avena o loro ceppi ibridati',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica cereale (es. Grano, Orzo, Segale, Avena)',
    commonExamples: ['Grano', 'Orzo', 'Segale', 'Avena', 'Farro']
  },
  {
    key: 'crustaceans',
    label: 'Crostacei',
    shortLabel: 'Crostacei',
    euRegulation: 'Reg. UE 1169/2011, All. II (2)',
    description: 'Granchi, aragoste, gamberi, scampi e prodotti derivati',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica (es. Gamberetti, Crayfish, Granchio)',
    commonExamples: ['Gamberi', 'Crayfish essiccato', 'Gamberetti', 'Granchio']
  },
  {
    key: 'eggs',
    label: 'Uova',
    shortLabel: 'Uova',
    euRegulation: 'Reg. UE 1169/2011, All. II (3)',
    description: 'Uova e prodotti a base di uova (paste, prodotti da forno, maionese)',
    hasDetailInput: false
  },
  {
    key: 'fish',
    label: 'Pesce',
    shortLabel: 'Pesce',
    euRegulation: 'Reg. UE 1169/2011, All. II (4)',
    description: 'Pesce e prodotti a base di pesce (pesce gatto affumicato, stoccafisso, salsa di pesce)',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica tipo (es. Pesce gatto, Merluzzo/Stoccafisso, Tilapia)',
    commonExamples: ['Pesce gatto', 'Stoccafisso/Merluzzo', 'Tilapia', 'Sgombro']
  },
  {
    key: 'peanuts',
    label: 'Arachidi',
    shortLabel: 'Arachidi',
    euRegulation: 'Reg. UE 1169/2011, All. II (5)',
    description: 'Arachidi, pasta di arachidi, olio di arachidi, snack kuli-kuli',
    hasDetailInput: false
  },
  {
    key: 'soybeans',
    label: 'Soia',
    shortLabel: 'Soia',
    euRegulation: 'Reg. UE 1169/2011, All. II (6)',
    description: 'Fagioli di soia, proteine di soia, lecitina di soia, cubetti di condimento',
    hasDetailInput: false
  },
  {
    key: 'milk',
    label: 'Latte e derivati (compreso lattosio)',
    shortLabel: 'Latte / Lattosio',
    euRegulation: 'Reg. UE 1169/2011, All. II (7)',
    description: 'Latte, burro, latte in polvere, formaggio, siero di latte e lattosio',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica (es. Latte in polvere, Siero, Lattosio)',
    commonExamples: ['Latte in polvere', 'Lattosio', 'Burro']
  },
  {
    key: 'nuts',
    label: 'Frutta a guscio',
    shortLabel: 'Frutta a guscio',
    euRegulation: 'Reg. UE 1169/2011, All. II (8)',
    description: 'Mandorle, nocciole, noci, anacardi, noci pecan, noci del Brasile, pistacchi',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica noce (es. Anacardi, Mandorle, Noci)',
    commonExamples: ['Anacardi', 'Mandorle', 'Noci', 'Nocciole', 'Pistacchi']
  },
  {
    key: 'celery',
    label: 'Sedano',
    shortLabel: 'Sedano',
    euRegulation: 'Reg. UE 1169/2011, All. II (9)',
    description: 'Gambi, foglie, semi di sedano e sedano rapa, miscele di spezie',
    hasDetailInput: false
  },
  {
    key: 'mustard',
    label: 'Senape',
    shortLabel: 'Senape',
    euRegulation: 'Reg. UE 1169/2011, All. II (10)',
    description: 'Semi di senape, polvere di senape, salse e condimenti',
    hasDetailInput: false
  },
  {
    key: 'sesame',
    label: 'Semi di sesamo',
    shortLabel: 'Sesamo',
    euRegulation: 'Reg. UE 1169/2011, All. II (11)',
    description: 'Semi di sesamo, olio di sesamo, tahina, dolciumi',
    hasDetailInput: false
  },
  {
    key: 'sulphites',
    label: 'Anidride solforosa e solfiti',
    shortLabel: 'Solfiti (>10mg)',
    euRegulation: 'Reg. UE 1169/2011, All. II (12)',
    description: 'Concentrazioni superiori a 10 mg/kg o 10 mg/litro (conservanti in frutta secca, vino di palma)',
    hasDetailInput: false
  },
  {
    key: 'lupin',
    label: 'Lupini',
    shortLabel: 'Lupini',
    euRegulation: 'Reg. UE 1169/2011, All. II (13)',
    description: 'Semi e farina di lupino, prodotti da forno speciali',
    hasDetailInput: false
  },
  {
    key: 'molluscs',
    label: 'Molluschi',
    shortLabel: 'Molluschi',
    euRegulation: 'Reg. UE 1169/2011, All. II (14)',
    description: 'Cozze, vongole, chiocciole/lumache africane, ostriche, calamari, polpi',
    hasDetailInput: true,
    detailPlaceholder: 'Specifica (es. Lumache africane, Calamari)',
    commonExamples: ['Lumache giganti africane', 'Calamari', 'Cozze']
  }
];

export const ALLERGEN_STATUS_LABELS: Record<AllergenPresence, { label: string; badgeClass: string; desc: string }> = {
  contains: {
    label: 'Presente come ingrediente',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    desc: 'Ingrediente allergenico confermato'
  },
  may_contain: {
    label: 'Può contenere tracce',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    desc: 'Possibile contaminazione crociata o stabilimento condiviso'
  },
  not_declared: {
    label: 'Non dichiarato sulla confezione',
    badgeClass: 'bg-stone-100 text-slate-600 border-stone-200',
    desc: 'Non specificato in etichetta (non assumere privo di allergeni)'
  },
  verified_absent: {
    label: 'Certificato assente (Testato)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
    desc: 'Documentato privo di questo allergene'
  }
};

export function createDefaultAllergens(): AllergenRecords {
  const records: Partial<AllergenRecords> = {};
  EU_ALLERGENS.forEach(item => {
    records[item.key] = {
      status: 'not_declared',
      specificDetails: ''
    };
  });
  return records as AllergenRecords;
}

export function createDefaultDietaryInfo(): ProductDietaryInfo {
  return {
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFreeClaim: false,
    lactoseFreeClaim: false,
    intoleranceNotes: '',
    warningNote: '',
    infoSource: 'Manufacturer label inspection',
    verificationStatus: 'unverified',
    lastReviewedDate: new Date().toISOString().split('T')[0],
    allergens: createDefaultAllergens()
  };
}

export interface AllergenSummaryItem {
  meta: AllergenMeta;
  status: AllergenPresence;
  specificDetails?: string;
  displayLabel: string;
}

export function getContainsList(dietary?: ProductDietaryInfo): AllergenSummaryItem[] {
  if (!dietary?.allergens) return [];
  const list: AllergenSummaryItem[] = [];
  EU_ALLERGENS.forEach(meta => {
    const item = dietary.allergens[meta.key];
    if (item && item.status === 'contains') {
      const displayLabel = item.specificDetails?.trim()
        ? `${meta.label} (${item.specificDetails.trim()})`
        : meta.label;
      list.push({ meta, status: 'contains', specificDetails: item.specificDetails, displayLabel });
    }
  });
  return list;
}

export function getMayContainList(dietary?: ProductDietaryInfo): AllergenSummaryItem[] {
  if (!dietary?.allergens) return [];
  const list: AllergenSummaryItem[] = [];
  EU_ALLERGENS.forEach(meta => {
    const item = dietary.allergens[meta.key];
    if (item && item.status === 'may_contain') {
      const displayLabel = item.specificDetails?.trim()
        ? `${meta.label} (${item.specificDetails.trim()})`
        : meta.label;
      list.push({ meta, status: 'may_contain', specificDetails: item.specificDetails, displayLabel });
    }
  });
  return list;
}

export function getVerifiedAbsentList(dietary?: ProductDietaryInfo): AllergenSummaryItem[] {
  if (!dietary?.allergens) return [];
  const list: AllergenSummaryItem[] = [];
  EU_ALLERGENS.forEach(meta => {
    const item = dietary.allergens[meta.key];
    if (item && item.status === 'verified_absent') {
      list.push({ meta, status: 'verified_absent', specificDetails: item.specificDetails, displayLabel: meta.label });
    }
  });
  return list;
}

export function hasAllergenWarnings(dietary?: ProductDietaryInfo): boolean {
  if (!dietary?.allergens) return false;
  return EU_ALLERGENS.some(meta => {
    const st = dietary.allergens[meta.key]?.status;
    return st === 'contains' || st === 'may_contain';
  }) || Boolean(dietary.warningNote?.trim());
}

export function getDietaryBadges(dietary?: ProductDietaryInfo): { label: string; tone: 'emerald' | 'blue' | 'purple' }[] {
  if (!dietary) return [];
  const badges: { label: string; tone: 'emerald' | 'blue' | 'purple' }[] = [];
  if (dietary.vegan) badges.push({ label: 'Vegano', tone: 'emerald' });
  if (dietary.vegetarian && !dietary.vegan) badges.push({ label: 'Vegetariano', tone: 'emerald' });
  if (dietary.halal) badges.push({ label: 'Certificato Halal', tone: 'emerald' });
  if (dietary.glutenFreeClaim) badges.push({ label: 'Senza Glutine', tone: 'blue' });
  if (dietary.lactoseFreeClaim) badges.push({ label: 'Senza Lattosio', tone: 'blue' });
  return badges;
}
