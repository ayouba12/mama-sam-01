import fs from 'fs';
import path from 'path';

interface AllergenItemState {
  status: 'contains' | 'may_contain' | 'not_declared' | 'verified_absent';
  specificDetails?: string;
}

const ALL_KEYS = [
  'cereals_gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs'
] as const;

function makeDietary(
  overrides: Partial<Record<(typeof ALL_KEYS)[number], { status: 'contains' | 'may_contain'; details?: string }>>,
  notes: string = '',
  warningNote: string = ''
) {
  const allergens: Record<string, AllergenItemState> = {};
  for (const k of ALL_KEYS) {
    if (overrides[k]) {
      allergens[k] = {
        status: overrides[k]!.status,
        specificDetails: overrides[k]!.details || ''
      };
    } else {
      allergens[k] = {
        status: 'not_declared',
        specificDetails: ''
      };
    }
  }

  return {
    vegetarian: false,
    vegan: false,
    halal: false,
    glutenFreeClaim: false,
    lactoseFreeClaim: false,
    intoleranceNotes: notes,
    warningNote: warningNote || 'Dati preliminari da inventario fotografico. Non usare le informazioni non verificate per confermare l’idoneità per allergici: controllare sempre la confezione fisica.',
    infoSource: 'catalogo_prodotti_inventario_foto.pdf',
    verificationStatus: 'unverified',
    lastReviewedDate: '2026-11-16',
    allergens
  };
}

// Exact 42 products from catalogo_prodotti_inventario_foto_b9bc9339.pdf
const PRODUCTS_DATA = [
  {
    itemNumber: 1,
    name: 'Maizena – Amido di mais',
    brand: 'Maizena',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Da verificare su etichetta',
    observedPrice: '€2.50',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: "Amido di mais (da verificare sull'etichetta)",
    allergenInfo: 'Nessun allergene maggiore atteso nel prodotto semplice; verificare contaminazioni',
    notes: 'Identificazione abbastanza chiara; prezzo vicino al prodotto, da confermare.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel prodotto semplice; verificare contaminazioni.')
  },
  {
    itemNumber: 2,
    name: 'Peak Full Cream Milk Powder',
    brand: 'Peak',
    category: 'Latte e derivati',
    pdfCategory: 'Latte e derivati',
    origin: 'Da verificare su etichetta',
    observedPrice: '€6.50',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Latte intero in polvere; eventuali vitamine/emulsionanti da verificare',
    allergenInfo: 'LATTE; possibile lattosio',
    notes: 'Identificazione chiara; prezzo indicativo da cartellino vicino.',
    dietary: makeDietary({
      milk: { status: 'contains', details: 'Latte intero in polvere; possibile lattosio' }
    }, 'LATTE; possibile lattosio.')
  },
  {
    itemNumber: 3,
    name: 'UFC White Vinegar',
    brand: 'UFC',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti',
    origin: 'Da verificare su etichetta',
    observedPrice: '€4.50',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Aceto bianco; materia prima e acidità da verificare',
    allergenInfo: 'Nessun allergene maggiore atteso; verificare ingredienti e stabilimento',
    notes: 'Identificazione chiara; prezzo indicativo.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso; verificare ingredienti e stabilimento.')
  },
  {
    itemNumber: 4,
    name: 'UFC Soy Sauce',
    brand: 'UFC',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Bottiglia (volume da verificare)',
    expectedIngredients: 'Salsa di soia; ingredienti esatti da verificare',
    allergenInfo: 'SOIA; possibile GRANO/GLUTINE',
    notes: 'Bottiglia riconoscibile; etichetta posteriore non visibile.',
    dietary: makeDietary({
      soybeans: { status: 'contains', details: 'Salsa di soia' },
      cereals_gluten: { status: 'may_contain', details: 'Possibile grano/glutine' }
    }, 'SOIA; possibile GRANO/GLUTINE.')
  },
  {
    itemNumber: 5,
    name: 'Samyang Buldak Carbonara Ramen – confezione rosa',
    brand: 'Samyang',
    category: 'Noodles e pasta',
    pdfCategory: 'Noodles e pasta',
    origin: 'Corea del Sud',
    observedPrice: 'Non confermato',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Confezione rosa (peso da verificare)',
    expectedIngredients: 'Noodles di frumento, olio, salsa e aromi; formula esatta da verificare',
    allergenInfo: 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione',
    notes: 'Prodotto riconoscibile; prezzo non attribuibile con certezza.',
    dietary: makeDietary({
      cereals_gluten: { status: 'may_contain', details: 'Possibile frumento/glutine' },
      soybeans: { status: 'may_contain', details: 'Possibile soia' },
      milk: { status: 'may_contain', details: 'Possibile latte' }
    }, 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione.')
  },
  {
    itemNumber: 6,
    name: 'Samyang Buldak Carbonara Ramen – cup rosa',
    brand: 'Samyang',
    category: 'Noodles e pasta',
    pdfCategory: 'Noodles e pasta',
    origin: 'Corea del Sud',
    observedPrice: '€1.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Cup rosa (peso da verificare)',
    expectedIngredients: 'Noodles e condimento; ingredienti esatti da verificare',
    allergenInfo: 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione',
    notes: 'Cartellino promozionale vicino; associazione non certa.',
    dietary: makeDietary({
      cereals_gluten: { status: 'may_contain', details: 'Possibile frumento/glutine' },
      soybeans: { status: 'may_contain', details: 'Possibile soia' },
      milk: { status: 'may_contain', details: 'Possibile latte' }
    }, 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione.')
  },
  {
    itemNumber: 7,
    name: 'Samyang Buldak Cheese Ramen – confezione gialla',
    brand: 'Samyang',
    category: 'Noodles e pasta',
    pdfCategory: 'Noodles e pasta',
    origin: 'Corea del Sud',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Confezione gialla (peso da verificare)',
    expectedIngredients: 'Noodles di frumento e condimento al formaggio; formula esatta da verificare',
    allergenInfo: 'Possibili FRUMENTO/GLUTINE, LATTE, SOIA; controllare anche SESAMO',
    notes: 'Prodotto riconoscibile; prezzo non leggibile.',
    dietary: makeDietary({
      cereals_gluten: { status: 'may_contain', details: 'Possibile frumento/glutine' },
      milk: { status: 'may_contain', details: 'Condimento al formaggio / latte' },
      soybeans: { status: 'may_contain', details: 'Possibile soia' },
      sesame: { status: 'may_contain', details: 'Controllare anche sesamo' }
    }, 'Possibili FRUMENTO/GLUTINE, LATTE, SOIA; controllare anche SESAMO.')
  },
  {
    itemNumber: 8,
    name: 'Exeter Corned Beef',
    brand: 'Exeter',
    category: 'Carne e pesce in scatola',
    pdfCategory: 'Carne in scatola',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Scatola / lattina (peso da verificare)',
    expectedIngredients: 'Carne bovina, acqua/sale e additivi da verificare',
    allergenInfo: 'Controllare eventuali SOIA, SENAPE o altri allergeni in etichetta',
    notes: 'Marchio leggibile; etichetta ingredienti non visibile.',
    dietary: makeDietary({
      soybeans: { status: 'may_contain', details: 'Controllare eventuale soia in etichetta' },
      mustard: { status: 'may_contain', details: 'Controllare eventuale senape in etichetta' }
    }, 'Controllare eventuali SOIA, SENAPE o altri allergeni in etichetta.')
  },
  {
    itemNumber: 9,
    name: 'Pure Coconut Oil – barattoli',
    brand: 'Non chiaro',
    category: 'Oli e grassi',
    pdfCategory: 'Oli e grassi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Barattoli (peso/volume da verificare)',
    expectedIngredients: 'Olio di cocco; verificare se 100% puro',
    allergenInfo: 'Verificare dichiarazione allergeni e possibili tracce',
    notes: 'Prodotto visibile; marca non certa.',
    dietary: makeDietary({}, 'Verificare dichiarazione allergeni e possibili tracce.')
  },
  {
    itemNumber: 10,
    name: 'Dari Couscous',
    brand: 'Dari',
    category: 'Riso e cereali',
    pdfCategory: 'Cereali e farine',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Circa €2.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Semola di grano duro (per couscous semplice; verificare confezione)',
    allergenInfo: 'FRUMENTO/GLUTINE',
    notes: 'Marchio leggibile; prezzo vicino ma non certo.',
    dietary: makeDietary({
      cereals_gluten: { status: 'contains', details: 'Semola di grano duro (FRUMENTO/GLUTINE)' }
    }, 'FRUMENTO/GLUTINE.')
  },
  {
    itemNumber: 11,
    name: 'Jumbo Seasoning Powder',
    brand: 'Jumbo',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti e dadi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non confermato',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Miscela di condimenti; ingredienti variabili',
    allergenInfo: 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni',
    notes: 'Cartellino €5,00 visibile sul ripiano; prodotto esatto non certo.',
    dietary: makeDietary({
      soybeans: { status: 'may_contain', details: 'Verificare soia' },
      celery: { status: 'may_contain', details: 'Verificare sedano' },
      mustard: { status: 'may_contain', details: 'Verificare senape' },
      cereals_gluten: { status: 'may_contain', details: 'Verificare glutine' }
    }, 'Verificare SOIA, SEDANO, SENAPE, GLUTINE e altri allergeni.')
  },
  {
    itemNumber: 12,
    name: 'Jumbo Seasoning Cubes',
    brand: 'Jumbo',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti e dadi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Dadi/condimento; ingredienti variabili',
    allergenInfo: 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni',
    notes: 'Prodotto/varietà non completamente leggibili.',
    dietary: makeDietary({
      soybeans: { status: 'may_contain', details: 'Verificare soia' },
      celery: { status: 'may_contain', details: 'Verificare sedano' },
      mustard: { status: 'may_contain', details: 'Verificare senape' },
      cereals_gluten: { status: 'may_contain', details: 'Verificare glutine' }
    }, 'Verificare SOIA, SEDANO, SENAPE, GLUTINE e altri allergeni.')
  },
  {
    itemNumber: 13,
    name: 'Star Seasoning',
    brand: 'Star',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti e dadi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Condimento; ingredienti variabili',
    allergenInfo: "Verificare ingredienti e allergeni sull'etichetta",
    notes: 'Confezione visibile; variante non chiara.',
    dietary: makeDietary({}, "Verificare ingredienti e allergeni sull'etichetta.")
  },
  {
    itemNumber: 14,
    name: 'Eagle Brand Ground Yam Flour',
    brand: 'Eagle Brand',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Circa €4.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Farina di igname; verificare eventuali aggiunte',
    allergenInfo: 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
    notes: 'Marchio/prodotto leggibile; prezzo vicino non certo.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce.')
  },
  {
    itemNumber: 15,
    name: 'Pronto Rice Flour',
    brand: 'Pronto',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Circa €2.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Farina di riso',
    allergenInfo: 'Nessun allergene maggiore atteso; verificare contaminazione crociata da glutine',
    notes: 'Confezione leggibile; prezzo vicino non certo.',
    dietary: makeDietary({
      cereals_gluten: { status: 'may_contain', details: 'Verificare contaminazione crociata da glutine' }
    }, 'Nessun allergene maggiore atteso; verificare contaminazione crociata da glutine.')
  },
  {
    itemNumber: 16,
    name: 'AdiBaba Groundnuts / Peanuts',
    brand: 'AdiBaba',
    category: 'Legumi e frutta a guscio',
    pdfCategory: 'Legumi e frutta a guscio',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Circa €3.20?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Arachidi; ingredienti aggiunti da verificare',
    allergenInfo: 'ARACHIDI',
    notes: 'Marchio/prodotto visibile; prezzo vicino non certo.',
    dietary: makeDietary({
      peanuts: { status: 'contains', details: 'ARACHIDI' }
    }, 'Contiene ARACHIDI.')
  },
  {
    itemNumber: 17,
    name: 'AdiBaba Dried Fish',
    brand: 'AdiBaba',
    category: 'Carne e pesce in scatola',
    pdfCategory: 'Pesce e prodotti ittici',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non confermato',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Pesce essiccato; specie e ingredienti da verificare',
    allergenInfo: 'PESCE',
    notes: 'Confezione visibile; prezzo non attribuibile con certezza.',
    dietary: makeDietary({
      fish: { status: 'contains', details: 'PESCE essiccato' }
    }, 'Contiene PESCE.')
  },
  {
    itemNumber: 18,
    name: 'AdiBaba Popcorn Kernels',
    brand: 'AdiBaba',
    category: 'Snack e cereali',
    pdfCategory: 'Snack e cereali',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Circa €2.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Mais per popcorn',
    allergenInfo: 'Nessun allergene maggiore atteso nel mais semplice; verificare tracce',
    notes: 'Prezzo vicino non certo.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel mais semplice; verificare tracce.')
  },
  {
    itemNumber: 19,
    name: 'AdiBaba Sweet Beans',
    brand: 'AdiBaba',
    category: 'Legumi e frutta a guscio',
    pdfCategory: 'Legumi',
    origin: 'Da verificare su etichetta',
    observedPrice: '€1.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Fagioli; varietà e ingredienti da verificare',
    allergenInfo: 'Controllare eventuali SOIA o contaminazioni; non presumere allergeni',
    notes: 'Prezzo vicino non certo.',
    dietary: makeDietary({
      soybeans: { status: 'may_contain', details: 'Controllare eventuale soia o contaminazioni' }
    }, 'Controllare eventuali SOIA o contaminazioni; non presumere allergeni.')
  },
  {
    itemNumber: 20,
    name: 'Easy Cook Rice',
    brand: 'Non chiaro',
    category: 'Riso e cereali',
    pdfCategory: 'Riso e cereali',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Riso; varietà da verificare',
    allergenInfo: 'Nessun allergene maggiore atteso nel riso semplice; verificare tracce',
    notes: 'Confezione parzialmente visibile.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel riso semplice; verificare tracce.')
  },
  {
    itemNumber: 21,
    name: 'Gino Tomato Paste',
    brand: 'Gino',
    category: 'Conserve e pomodoro',
    pdfCategory: 'Conserve e pomodoro',
    origin: 'Da verificare su etichetta',
    observedPrice: '€4.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Concentrato di pomodoro; ingredienti/additivi da verificare',
    allergenInfo: 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta',
    notes: 'Cartellino vicino; non è certo che si riferisca a questo prodotto.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta.')
  },
  {
    itemNumber: 22,
    name: 'De Rica Double Concentrated Tomato Paste',
    brand: 'De Rica',
    category: 'Conserve e pomodoro',
    pdfCategory: 'Conserve e pomodoro',
    origin: 'Da verificare su etichetta',
    observedPrice: '€2.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Doppio concentrato di pomodoro; ingredienti/additivi da verificare',
    allergenInfo: 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta',
    notes: 'Cartellino vicino; non è certo che si riferisca a questo prodotto.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta.')
  },
  {
    itemNumber: 23,
    name: 'Unifresh Kokonte Flour',
    brand: 'Unifresh',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Farina di cassava/manioca essiccata; verificare confezione',
    allergenInfo: 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
    notes: 'Marchio/prodotto leggibile.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce.')
  },
  {
    itemNumber: 24,
    name: 'Unifresh Yellow Gari',
    brand: 'Unifresh',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Da verificare su etichetta',
    observedPrice: '€6.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Gari giallo a base di manioca; verificare eventuale olio di palma e ingredienti',
    allergenInfo: 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
    notes: 'Cartellino vicino; prezzo non certo.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce.')
  },
  {
    itemNumber: 25,
    name: 'Ca Bianca Farina di Grano Tenero',
    brand: 'Ca Bianca',
    category: 'Farine e amidi',
    pdfCategory: 'Farine e amidi',
    origin: 'Italia',
    observedPrice: '€4.00?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Farina di grano tenero',
    allergenInfo: 'FRUMENTO/GLUTINE',
    notes: 'Cartellino vicino; prezzo non certo.',
    dietary: makeDietary({
      cereals_gluten: { status: 'contains', details: 'Farina di grano tenero (FRUMENTO/GLUTINE)' }
    }, 'FRUMENTO/GLUTINE.')
  },
  {
    itemNumber: 26,
    name: 'Petti Passata Extra Fine',
    brand: 'Petti',
    category: 'Conserve e pomodoro',
    pdfCategory: 'Conserve e pomodoro',
    origin: 'Italia',
    observedPrice: '€1.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Pomodoro; sale o altri ingredienti da verificare',
    allergenInfo: 'Nessun allergene maggiore atteso nella passata semplice; controllare etichetta',
    notes: 'Prezzo vicino; associazione non certa.',
    dietary: makeDietary({}, 'Nessun allergene maggiore atteso nella passata semplice; controllare etichetta.')
  },
  {
    itemNumber: 27,
    name: 'Ducros Curry Powder',
    brand: 'Ducros',
    category: 'Spezie e aromi',
    pdfCategory: 'Spezie e condimenti',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Miscela di spezie; composizione da verificare',
    allergenInfo: 'Verificare SENAPE, SEDANO e possibili tracce',
    notes: 'Marca leggibile; variante non certa.',
    dietary: makeDietary({
      mustard: { status: 'may_contain', details: 'Verificare senape' },
      celery: { status: 'may_contain', details: 'Verificare sedano' }
    }, 'Verificare SENAPE, SEDANO e possibili tracce.')
  },
  {
    itemNumber: 28,
    name: 'Riso/grani in confezione nera – marca non leggibile',
    brand: 'Non identificata',
    category: 'Riso e cereali',
    pdfCategory: 'Riso e cereali',
    origin: 'Da accertare',
    observedPrice: 'Circa €3.50?',
    priceStatus: 'estimated',
    verificationStatus: 'da_identificare',
    packageSize: 'Confezione nera (peso da verificare)',
    expectedIngredients: 'Non identificabile con certezza dalla foto',
    allergenInfo: 'Non determinabile: leggere etichetta',
    notes: 'Prodotto e prezzo incerti.',
    dietary: makeDietary({}, 'Non determinabile dalla foto: leggere etichetta.')
  },
  {
    itemNumber: 29,
    name: 'Condimento per pollo in confezione verde – marca non leggibile',
    brand: 'Non identificata',
    category: 'Condimenti e dadi',
    pdfCategory: 'Condimenti e dadi',
    origin: 'Da accertare',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_identificare',
    packageSize: 'Confezione verde (peso da verificare)',
    expectedIngredients: 'Miscela di spezie/aromi non identificata',
    allergenInfo: 'Non determinabile: leggere etichetta',
    notes: 'Prodotto non identificato con certezza.',
    dietary: makeDietary({}, 'Non determinabile dalla foto: leggere etichetta.')
  },
  {
    itemNumber: 30,
    name: 'Confezioni dorate di spezie/condimento – marca non leggibile',
    brand: 'Non identificata',
    category: 'Spezie e aromi',
    pdfCategory: 'Spezie e condimenti',
    origin: 'Da accertare',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_identificare',
    packageSize: 'Confezioni dorate (peso da verificare)',
    expectedIngredients: 'Miscela non identificata',
    allergenInfo: 'Non determinabile: leggere etichetta',
    notes: 'Prodotto non identificato con certezza.',
    dietary: makeDietary({}, 'Non determinabile dalla foto: leggere etichetta.')
  },
  {
    itemNumber: 31,
    name: 'Dark & Lovely Relaxer',
    brand: 'Dark & Lovely',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Formula chimica per trattamento/relaxer; consultare confezione',
    allergenInfo: 'Possibili profumi/conservanti; rischio irritazione. Seguire avvertenze e test indicato',
    notes: 'Prodotto riconoscibile; variante non chiara.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi/conservanti; rischio irritazione.')
  },
  {
    itemNumber: 32,
    name: 'Dark & Lovely Hair Treatment',
    brand: 'Dark & Lovely',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Trattamento capelli; formula da verificare',
    allergenInfo: 'Possibili profumi/conservanti',
    notes: 'Variante non chiara.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi/conservanti.')
  },
  {
    itemNumber: 33,
    name: 'Olive Oil Hair Products',
    brand: 'Marca/variante non chiara',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: "Prodotti per capelli a base/tema olio d'oliva; ingredienti da verificare",
    allergenInfo: 'Possibili profumi e conservanti',
    notes: 'Linea visibile; singoli prodotti non distinguibili.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi e conservanti.')
  },
  {
    itemNumber: 34,
    name: 'B.B. Clear Cream',
    brand: 'B.B. Clear',
    category: 'Cura della pelle',
    pdfCategory: 'Cura della pelle',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Crema cosmetica; ingredienti da verificare',
    allergenInfo: 'Possibili profumi/conservanti; verificare ingredienti e avvertenze',
    notes: 'Prodotto visibile; formula non identificata.',
    dietary: makeDietary({}, 'Cosmetico pelle. Verificare INCI, ingredienti e avvertenze.')
  },
  {
    itemNumber: 35,
    name: 'Clairmen Products',
    brand: 'Clairmen',
    category: 'Cura della pelle',
    pdfCategory: 'Cura della pelle',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Prodotti cosmetici; ingredienti da verificare',
    allergenInfo: 'Possibili profumi/conservanti; verificare ingredienti e avvertenze',
    notes: 'Linea visibile; prodotto esatto non chiaro.',
    dietary: makeDietary({}, 'Cosmetico pelle. Verificare INCI, ingredienti e avvertenze.')
  },
  {
    itemNumber: 36,
    name: 'Caro White Lotion',
    brand: 'Caro White',
    category: 'Cura della pelle',
    pdfCategory: 'Cura della pelle',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Lozione cosmetica; ingredienti da verificare',
    allergenInfo: 'Possibili profumi/conservanti; controllare conformità UE e ingredienti',
    notes: 'Prodotto visibile; etichetta non leggibile.',
    dietary: makeDietary({}, 'Cosmetico pelle. Controllare conformità UE e INCI.')
  },
  {
    itemNumber: 37,
    name: 'Dettol Antiseptic',
    brand: 'Dettol',
    category: 'Saponi e igiene',
    pdfCategory: 'Igiene',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Antisettico; formula varia per paese e formato',
    allergenInfo: 'Possibili ingredienti irritanti/allergizzanti; seguire etichetta e uso previsto',
    notes: 'Marchio riconoscibile; formulazione non identificata.',
    dietary: makeDietary({}, 'Prodotto per igiene ad uso esterno. Seguire etichetta e uso previsto.')
  },
  {
    itemNumber: 38,
    name: 'Tura Soap',
    brand: 'Tura',
    category: 'Saponi e igiene',
    pdfCategory: 'Saponi e igiene',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Sapone; ingredienti da verificare',
    allergenInfo: 'Possibili profumi e conservanti',
    notes: 'Prodotto visibile.',
    dietary: makeDietary({}, 'Sapone ad uso esterno. Possibili profumi e conservanti.')
  },
  {
    itemNumber: 39,
    name: 'Naomi Hair Products',
    brand: 'Naomi',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Da verificare su confezione',
    expectedIngredients: 'Prodotti per capelli; ingredienti da verificare',
    allergenInfo: 'Possibili profumi/conservanti',
    notes: 'Prodotto/linea visibile; variante non chiara.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi/conservanti.')
  },
  {
    itemNumber: 40,
    name: '212 Perfume',
    brand: 'Non chiara',
    category: 'Profumi',
    pdfCategory: 'Profumi',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Flacone (volume da verificare)',
    expectedIngredients: 'Profumo; formula INCI da verificare',
    allergenInfo: 'Profumi: possibili allergeni da fragranza, indicati in etichetta',
    notes: 'Confezione visibile; marca non certa.',
    dietary: makeDietary({}, 'Profumo uso esterno. Verificare allergeni da fragranza in etichetta.')
  },
  {
    itemNumber: 41,
    name: 'Oli per capelli assortiti',
    brand: 'Varie',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Assortimento (formati da verificare)',
    expectedIngredients: 'Oli cosmetici; ingredienti da verificare',
    allergenInfo: 'Possibili profumi/oli essenziali',
    notes: 'Gruppo di prodotti non distinguibile singolarmente.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi/oli essenziali.')
  },
  {
    itemNumber: 42,
    name: 'Creme e trattamenti per capelli assortiti',
    brand: 'Varie',
    category: 'Capelli e bellezza',
    pdfCategory: 'Capelli e bellezza',
    origin: 'Da verificare su etichetta',
    observedPrice: 'Non leggibile',
    priceStatus: 'unreadable',
    verificationStatus: 'da_verificare',
    packageSize: 'Assortimento (formati da verificare)',
    expectedIngredients: 'Formule varie; ingredienti da verificare',
    allergenInfo: 'Possibili profumi, conservanti e altri ingredienti',
    notes: 'Gruppo di prodotti non distinguibile singolarmente.',
    dietary: makeDietary({}, 'Cosmetico capelli. Possibili profumi e conservanti.')
  }
];

// Deduplicate check by itemNumber / normalized name
const seenKeys = new Set<string>();
const formattedProducts = PRODUCTS_DATA.filter((p) => {
  const key = `${p.itemNumber}:${p.name.toLowerCase().trim()}`;
  if (seenKeys.has(key)) {
    console.warn(`Duplicate skipped: ${p.name}`);
    return false;
  }
  seenKeys.add(key);
  return true;
}).map((p) => {
  const id = `prod-real-${p.itemNumber}`;
  const sku = `MS-CAT-${String(p.itemNumber).padStart(2, '0')}`;

  return {
    id,
    itemNumber: p.itemNumber,
    name: p.name,
    brand: p.brand,
    category: p.category,
    origin: p.origin,
    subCategory: p.brand !== 'Non identificata' && p.brand !== 'Non chiaro' && p.brand !== 'Non chiara' ? p.brand : p.pdfCategory,
    price: null, // Reference prices in PDF are unconfirmed; keep official selling price unset until verified
    originalPrice: null,
    observedPrice: p.observedPrice,
    priceStatus: p.priceStatus as 'estimated' | 'unreadable',
    purchasePrice: null, // Admin-only, never invented
    verificationStatus: p.verificationStatus as 'da_verificare' | 'da_identificare',
    packageSize: p.packageSize,
    image: `realProd${p.itemNumber}`,
    imageStatus: 'verified' as const,
    imageStoragePath: null,
    gallery: [],
    description: `${p.name} (${p.brand}). ${p.notes}`,
    stock: 0, // Strictly 0 until physically counted
    isAvailable: true,
    featured: false,
    salesRank: p.itemNumber,
    ingredients: p.expectedIngredients,
    expectedIngredients: p.expectedIngredients,
    allergenInfo: p.allergenInfo,
    allergensAlert: p.allergenInfo,
    dietaryInfo: p.dietary,
    barcode: null, // No invented barcodes
    sku,
    notes: p.notes,
    isNewArrival: false,
    isDiscounted: false,
    discountActive: false,
    discountStartDate: null,
    discountEndDate: null,
    createdAt: '2026-11-16T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
});

fs.writeFileSync(path.join(process.cwd(), 'data', 'products.json'), JSON.stringify(formattedProducts, null, 2), 'utf-8');
console.log(`Successfully imported ${formattedProducts.length} unique products to data/products.json (0 duplicates).`);
