-- ====================================================================
-- MAMA SAM SUPERMARKET - SUPABASE SEED DATA (REAL INVENTORY: 42 PRODUCTS)
-- ====================================================================

-- 1. Store Settings
INSERT INTO public.store_settings (id, announcement, announcement_active, store_name, address, google_maps_url, phone1, phone2, whatsapp_number, email, hours_mon_sat, hours_sun, pickup_estimated_minutes)
VALUES (
  'primary',
  'Ordina online e ritira comodamente in negozio in Via Ugo Bassi 104, Messina (~30 min)',
  true,
  'Mama Sam Supermercato Africano & Caraibico',
  'Via Ugo Bassi 104, Isolato 147, 98123 Messina ME, Italia',
  'https://maps.google.com/?q=Via+Ugo+Bassi+104+Messina+Italy',
  '+39 351 290 1397',
  '+39 351 206 2949',
  '393512901397',
  'mamasamafrican@gmail.com',
  '8:00 - 20:30 (Orario Continuato)',
  '10:00 - 16:00',
  30
)
ON CONFLICT (id) DO UPDATE SET
  announcement = EXCLUDED.announcement,
  store_name = EXCLUDED.store_name,
  address = EXCLUDED.address,
  hours_mon_sat = EXCLUDED.hours_mon_sat;

-- 2. Categories (15 Clean Departments)
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-farine-amidi', 'Farine e amidi', 'Maizena amido di mais, Eagle Brand Yam Flour, Pronto Rice Flour, Unifresh Kokonte & Yellow Gari, Ca Bianca', 'catFarineAmidi', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-latte-derivati', 'Latte e derivati', 'Peak Full Cream Milk Powder in polvere intero', 'catLatteDerivati', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-condimenti-dadi', 'Condimenti e dadi', 'UFC White Vinegar & Soy Sauce, Jumbo Seasoning Powder & Cubes, Star Seasoning', 'catCondimentiDadi', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-noodles-pasta', 'Noodles e pasta', 'Samyang Buldak Carbonara Ramen (busta & cup rosa), Samyang Buldak Cheese Ramen', 'catNoodlesPasta', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-carne-pesce', 'Carne e pesce in scatola', 'Exeter Corned Beef in scatola e AdiBaba Dried Fish essiccato', 'catCarnePesce', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-oli-grassi', 'Oli e grassi', 'Pure Coconut Oil in barattoli', 'catOliGrassi', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-riso-cereali', 'Riso e cereali', 'Dari Couscous semola di grano duro, Easy Cook Rice e riso/grani in confezione nera', 'catRisoCereali', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-legumi-noci', 'Legumi e frutta a guscio', 'AdiBaba Groundnuts / Peanuts arachidi e AdiBaba Sweet Beans fagioli', 'catLegumiNoci', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-snack-cereali', 'Snack e cereali', 'AdiBaba Popcorn Kernels mais per popcorn', 'catSnackCereali', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-conserve-pomodoro', 'Conserve e pomodoro', 'Gino Tomato Paste, De Rica Double Concentrated Tomato Paste e Petti Passata Extra Fine', 'catConservePomodoro', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-spezie-aromi', 'Spezie e aromi', 'Ducros Curry Powder e miscele di spezie/condimenti tradizionali', 'catSpezieAromi', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-capelli-bellezza', 'Capelli e bellezza', 'Dark & Lovely Relaxer & Hair Treatment, Olive Oil Hair, Naomi, oli e creme per capelli', 'catCapelliBellezza', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-cura-pelle', 'Cura della pelle', 'B.B. Clear Cream, Clairmen Products e Caro White Lotion', 'catCuraPelle', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-saponi-igiene', 'Saponi e igiene', 'Dettol Antiseptic liquido e Tura Soap', 'catSaponiIgiene', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-profumi', 'Profumi', '212 Perfume e fragranze corpo', 'catProfumi', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image, item_count = EXCLUDED.item_count;

-- 3. Products (42 Real Inventory Items)
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-1', 1, 'Maizena – Amido di mais', 'Maizena', 'Farine e amidi', 'Da verificare su etichetta',
  NULL, '€2.50', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd1', 'verified', 'Maizena – Amido di mais (Maizena). Identificazione abbastanza chiara; prezzo vicino al prodotto, da confermare.',
  0, true, 'da_verificare',
  'Amido di mais (da verificare sull''etichetta)', 'Amido di mais (da verificare sull''etichetta)', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare contaminazioni', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare contaminazioni',
  'MS-CAT-01', NULL, 'Identificazione abbastanza chiara; prezzo vicino al prodotto, da confermare.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-2', 2, 'Peak Full Cream Milk Powder', 'Peak', 'Latte e derivati', 'Da verificare su etichetta',
  NULL, '€6.50', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd2', 'verified', 'Peak Full Cream Milk Powder (Peak). Identificazione chiara; prezzo indicativo da cartellino vicino.',
  0, true, 'da_verificare',
  'Latte intero in polvere; eventuali vitamine/emulsionanti da verificare', 'Latte intero in polvere; eventuali vitamine/emulsionanti da verificare', 'LATTE; possibile lattosio', 'LATTE; possibile lattosio',
  'MS-CAT-02', NULL, 'Identificazione chiara; prezzo indicativo da cartellino vicino.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-3', 3, 'UFC White Vinegar', 'UFC', 'Condimenti e dadi', 'Da verificare su etichetta',
  NULL, '€4.50', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd3', 'verified', 'UFC White Vinegar (UFC). Identificazione chiara; prezzo indicativo.',
  0, true, 'da_verificare',
  'Aceto bianco; materia prima e acidità da verificare', 'Aceto bianco; materia prima e acidità da verificare', 'Nessun allergene maggiore atteso; verificare ingredienti e stabilimento', 'Nessun allergene maggiore atteso; verificare ingredienti e stabilimento',
  'MS-CAT-03', NULL, 'Identificazione chiara; prezzo indicativo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-4', 4, 'UFC Soy Sauce', 'UFC', 'Condimenti e dadi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Bottiglia (volume da verificare)', 'realProd4', 'verified', 'UFC Soy Sauce (UFC). Bottiglia riconoscibile; etichetta posteriore non visibile.',
  0, true, 'da_verificare',
  'Salsa di soia; ingredienti esatti da verificare', 'Salsa di soia; ingredienti esatti da verificare', 'SOIA; possibile GRANO/GLUTINE', 'SOIA; possibile GRANO/GLUTINE',
  'MS-CAT-04', NULL, 'Bottiglia riconoscibile; etichetta posteriore non visibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-5', 5, 'Samyang Buldak Carbonara Ramen – confezione rosa', 'Samyang', 'Noodles e pasta', 'Corea del Sud',
  NULL, 'Non confermato', 'unreadable', NULL, NULL,
  'Confezione rosa (peso da verificare)', 'realProd5', 'verified', 'Samyang Buldak Carbonara Ramen – confezione rosa (Samyang). Prodotto riconoscibile; prezzo non attribuibile con certezza.',
  0, true, 'da_verificare',
  'Noodles di frumento, olio, salsa e aromi; formula esatta da verificare', 'Noodles di frumento, olio, salsa e aromi; formula esatta da verificare', 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione', 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione',
  'MS-CAT-05', NULL, 'Prodotto riconoscibile; prezzo non attribuibile con certezza.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-6', 6, 'Samyang Buldak Carbonara Ramen – cup rosa', 'Samyang', 'Noodles e pasta', 'Corea del Sud',
  NULL, '€1.00?', 'estimated', NULL, NULL,
  'Cup rosa (peso da verificare)', 'realProd6', 'verified', 'Samyang Buldak Carbonara Ramen – cup rosa (Samyang). Cartellino promozionale vicino; associazione non certa.',
  0, true, 'da_verificare',
  'Noodles e condimento; ingredienti esatti da verificare', 'Noodles e condimento; ingredienti esatti da verificare', 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione', 'Possibili FRUMENTO/GLUTINE, SOIA, LATTE e altri allergeni secondo confezione',
  'MS-CAT-06', NULL, 'Cartellino promozionale vicino; associazione non certa.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-7', 7, 'Samyang Buldak Cheese Ramen – confezione gialla', 'Samyang', 'Noodles e pasta', 'Corea del Sud',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Confezione gialla (peso da verificare)', 'realProd7', 'verified', 'Samyang Buldak Cheese Ramen – confezione gialla (Samyang). Prodotto riconoscibile; prezzo non leggibile.',
  0, true, 'da_verificare',
  'Noodles di frumento e condimento al formaggio; formula esatta da verificare', 'Noodles di frumento e condimento al formaggio; formula esatta da verificare', 'Possibili FRUMENTO/GLUTINE, LATTE, SOIA; controllare anche SESAMO', 'Possibili FRUMENTO/GLUTINE, LATTE, SOIA; controllare anche SESAMO',
  'MS-CAT-07', NULL, 'Prodotto riconoscibile; prezzo non leggibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-8', 8, 'Exeter Corned Beef', 'Exeter', 'Carne e pesce in scatola', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Scatola / lattina (peso da verificare)', 'realProd8', 'verified', 'Exeter Corned Beef (Exeter). Marchio leggibile; etichetta ingredienti non visibile.',
  0, true, 'da_verificare',
  'Carne bovina, acqua/sale e additivi da verificare', 'Carne bovina, acqua/sale e additivi da verificare', 'Controllare eventuali SOIA, SENAPE o altri allergeni in etichetta', 'Controllare eventuali SOIA, SENAPE o altri allergeni in etichetta',
  'MS-CAT-08', NULL, 'Marchio leggibile; etichetta ingredienti non visibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-9', 9, 'Pure Coconut Oil – barattoli', 'Non chiaro', 'Oli e grassi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Barattoli (peso/volume da verificare)', 'realProd9', 'verified', 'Pure Coconut Oil – barattoli (Non chiaro). Prodotto visibile; marca non certa.',
  0, true, 'da_verificare',
  'Olio di cocco; verificare se 100% puro', 'Olio di cocco; verificare se 100% puro', 'Verificare dichiarazione allergeni e possibili tracce', 'Verificare dichiarazione allergeni e possibili tracce',
  'MS-CAT-09', NULL, 'Prodotto visibile; marca non certa.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-10', 10, 'Dari Couscous', 'Dari', 'Riso e cereali', 'Da verificare su etichetta',
  NULL, 'Circa €2.50?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd10', 'verified', 'Dari Couscous (Dari). Marchio leggibile; prezzo vicino ma non certo.',
  0, true, 'da_verificare',
  'Semola di grano duro (per couscous semplice; verificare confezione)', 'Semola di grano duro (per couscous semplice; verificare confezione)', 'FRUMENTO/GLUTINE', 'FRUMENTO/GLUTINE',
  'MS-CAT-10', NULL, 'Marchio leggibile; prezzo vicino ma non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-11', 11, 'Jumbo Seasoning Powder', 'Jumbo', 'Condimenti e dadi', 'Da verificare su etichetta',
  NULL, 'Non confermato', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd11', 'verified', 'Jumbo Seasoning Powder (Jumbo). Cartellino €5,00 visibile sul ripiano; prodotto esatto non certo.',
  0, true, 'da_verificare',
  'Miscela di condimenti; ingredienti variabili', 'Miscela di condimenti; ingredienti variabili', 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni', 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni',
  'MS-CAT-11', NULL, 'Cartellino €5,00 visibile sul ripiano; prodotto esatto non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-12', 12, 'Jumbo Seasoning Cubes', 'Jumbo', 'Condimenti e dadi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd12', 'verified', 'Jumbo Seasoning Cubes (Jumbo). Prodotto/varietà non completamente leggibili.',
  0, true, 'da_verificare',
  'Dadi/condimento; ingredienti variabili', 'Dadi/condimento; ingredienti variabili', 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni', 'Verificare SOIA, SEDANO (CELIERO), SENAPE, GLUTINE e altri allergeni',
  'MS-CAT-12', NULL, 'Prodotto/varietà non completamente leggibili.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-13', 13, 'Star Seasoning', 'Star', 'Condimenti e dadi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd13', 'verified', 'Star Seasoning (Star). Confezione visibile; variante non chiara.',
  0, true, 'da_verificare',
  'Condimento; ingredienti variabili', 'Condimento; ingredienti variabili', 'Verificare ingredienti e allergeni sull''etichetta', 'Verificare ingredienti e allergeni sull''etichetta',
  'MS-CAT-13', NULL, 'Confezione visibile; variante non chiara.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-14', 14, 'Eagle Brand Ground Yam Flour', 'Eagle Brand', 'Farine e amidi', 'Da verificare su etichetta',
  NULL, 'Circa €4.00?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd14', 'verified', 'Eagle Brand Ground Yam Flour (Eagle Brand). Marchio/prodotto leggibile; prezzo vicino non certo.',
  0, true, 'da_verificare',
  'Farina di igname; verificare eventuali aggiunte', 'Farina di igname; verificare eventuali aggiunte', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
  'MS-CAT-14', NULL, 'Marchio/prodotto leggibile; prezzo vicino non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-15', 15, 'Pronto Rice Flour', 'Pronto', 'Farine e amidi', 'Da verificare su etichetta',
  NULL, 'Circa €2.50?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd15', 'verified', 'Pronto Rice Flour (Pronto). Confezione leggibile; prezzo vicino non certo.',
  0, true, 'da_verificare',
  'Farina di riso', 'Farina di riso', 'Nessun allergene maggiore atteso; verificare contaminazione crociata da glutine', 'Nessun allergene maggiore atteso; verificare contaminazione crociata da glutine',
  'MS-CAT-15', NULL, 'Confezione leggibile; prezzo vicino non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-16', 16, 'AdiBaba Groundnuts / Peanuts', 'AdiBaba', 'Legumi e frutta a guscio', 'Da verificare su etichetta',
  NULL, 'Circa €3.20?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd16', 'verified', 'AdiBaba Groundnuts / Peanuts (AdiBaba). Marchio/prodotto visibile; prezzo vicino non certo.',
  0, true, 'da_verificare',
  'Arachidi; ingredienti aggiunti da verificare', 'Arachidi; ingredienti aggiunti da verificare', 'ARACHIDI', 'ARACHIDI',
  'MS-CAT-16', NULL, 'Marchio/prodotto visibile; prezzo vicino non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-17', 17, 'AdiBaba Dried Fish', 'AdiBaba', 'Carne e pesce in scatola', 'Da verificare su etichetta',
  NULL, 'Non confermato', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd17', 'verified', 'AdiBaba Dried Fish (AdiBaba). Confezione visibile; prezzo non attribuibile con certezza.',
  0, true, 'da_verificare',
  'Pesce essiccato; specie e ingredienti da verificare', 'Pesce essiccato; specie e ingredienti da verificare', 'PESCE', 'PESCE',
  'MS-CAT-17', NULL, 'Confezione visibile; prezzo non attribuibile con certezza.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-18', 18, 'AdiBaba Popcorn Kernels', 'AdiBaba', 'Snack e cereali', 'Da verificare su etichetta',
  NULL, 'Circa €2.50?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd18', 'verified', 'AdiBaba Popcorn Kernels (AdiBaba). Prezzo vicino non certo.',
  0, true, 'da_verificare',
  'Mais per popcorn', 'Mais per popcorn', 'Nessun allergene maggiore atteso nel mais semplice; verificare tracce', 'Nessun allergene maggiore atteso nel mais semplice; verificare tracce',
  'MS-CAT-18', NULL, 'Prezzo vicino non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-19', 19, 'AdiBaba Sweet Beans', 'AdiBaba', 'Legumi e frutta a guscio', 'Da verificare su etichetta',
  NULL, '€1.50?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd19', 'verified', 'AdiBaba Sweet Beans (AdiBaba). Prezzo vicino non certo.',
  0, true, 'da_verificare',
  'Fagioli; varietà e ingredienti da verificare', 'Fagioli; varietà e ingredienti da verificare', 'Controllare eventuali SOIA o contaminazioni; non presumere allergeni', 'Controllare eventuali SOIA o contaminazioni; non presumere allergeni',
  'MS-CAT-19', NULL, 'Prezzo vicino non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-20', 20, 'Easy Cook Rice', 'Non chiaro', 'Riso e cereali', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd20', 'verified', 'Easy Cook Rice (Non chiaro). Confezione parzialmente visibile.',
  0, true, 'da_verificare',
  'Riso; varietà da verificare', 'Riso; varietà da verificare', 'Nessun allergene maggiore atteso nel riso semplice; verificare tracce', 'Nessun allergene maggiore atteso nel riso semplice; verificare tracce',
  'MS-CAT-20', NULL, 'Confezione parzialmente visibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-21', 21, 'Gino Tomato Paste', 'Gino', 'Conserve e pomodoro', 'Da verificare su etichetta',
  NULL, '€4.00?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd21', 'verified', 'Gino Tomato Paste (Gino). Cartellino vicino; non è certo che si riferisca a questo prodotto.',
  0, true, 'da_verificare',
  'Concentrato di pomodoro; ingredienti/additivi da verificare', 'Concentrato di pomodoro; ingredienti/additivi da verificare', 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta', 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta',
  'MS-CAT-21', NULL, 'Cartellino vicino; non è certo che si riferisca a questo prodotto.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-22', 22, 'De Rica Double Concentrated Tomato Paste', 'De Rica', 'Conserve e pomodoro', 'Da verificare su etichetta',
  NULL, '€2.00?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd22', 'verified', 'De Rica Double Concentrated Tomato Paste (De Rica). Cartellino vicino; non è certo che si riferisca a questo prodotto.',
  0, true, 'da_verificare',
  'Doppio concentrato di pomodoro; ingredienti/additivi da verificare', 'Doppio concentrato di pomodoro; ingredienti/additivi da verificare', 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta', 'Nessun allergene maggiore atteso nel concentrato semplice; controllare etichetta',
  'MS-CAT-22', NULL, 'Cartellino vicino; non è certo che si riferisca a questo prodotto.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-23', 23, 'Unifresh Kokonte Flour', 'Unifresh', 'Farine e amidi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd23', 'verified', 'Unifresh Kokonte Flour (Unifresh). Marchio/prodotto leggibile.',
  0, true, 'da_verificare',
  'Farina di cassava/manioca essiccata; verificare confezione', 'Farina di cassava/manioca essiccata; verificare confezione', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
  'MS-CAT-23', NULL, 'Marchio/prodotto leggibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-24', 24, 'Unifresh Yellow Gari', 'Unifresh', 'Farine e amidi', 'Da verificare su etichetta',
  NULL, '€6.00?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd24', 'verified', 'Unifresh Yellow Gari (Unifresh). Cartellino vicino; prezzo non certo.',
  0, true, 'da_verificare',
  'Gari giallo a base di manioca; verificare eventuale olio di palma e ingredienti', 'Gari giallo a base di manioca; verificare eventuale olio di palma e ingredienti', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce', 'Nessun allergene maggiore atteso nel prodotto semplice; verificare tracce',
  'MS-CAT-24', NULL, 'Cartellino vicino; prezzo non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-25', 25, 'Ca Bianca Farina di Grano Tenero', 'Ca Bianca', 'Farine e amidi', 'Italia',
  NULL, '€4.00?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd25', 'verified', 'Ca Bianca Farina di Grano Tenero (Ca Bianca). Cartellino vicino; prezzo non certo.',
  0, true, 'da_verificare',
  'Farina di grano tenero', 'Farina di grano tenero', 'FRUMENTO/GLUTINE', 'FRUMENTO/GLUTINE',
  'MS-CAT-25', NULL, 'Cartellino vicino; prezzo non certo.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-26', 26, 'Petti Passata Extra Fine', 'Petti', 'Conserve e pomodoro', 'Italia',
  NULL, '€1.50?', 'estimated', NULL, NULL,
  'Da verificare su confezione', 'realProd26', 'verified', 'Petti Passata Extra Fine (Petti). Prezzo vicino; associazione non certa.',
  0, true, 'da_verificare',
  'Pomodoro; sale o altri ingredienti da verificare', 'Pomodoro; sale o altri ingredienti da verificare', 'Nessun allergene maggiore atteso nella passata semplice; controllare etichetta', 'Nessun allergene maggiore atteso nella passata semplice; controllare etichetta',
  'MS-CAT-26', NULL, 'Prezzo vicino; associazione non certa.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-27', 27, 'Ducros Curry Powder', 'Ducros', 'Spezie e aromi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd27', 'verified', 'Ducros Curry Powder (Ducros). Marca leggibile; variante non certa.',
  0, true, 'da_verificare',
  'Miscela di spezie; composizione da verificare', 'Miscela di spezie; composizione da verificare', 'Verificare SENAPE, SEDANO e possibili tracce', 'Verificare SENAPE, SEDANO e possibili tracce',
  'MS-CAT-27', NULL, 'Marca leggibile; variante non certa.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-28', 28, 'Riso/grani in confezione nera – marca non leggibile', 'Non identificata', 'Riso e cereali', 'Da accertare',
  NULL, 'Circa €3.50?', 'estimated', NULL, NULL,
  'Confezione nera (peso da verificare)', 'realProd28', 'verified', 'Riso/grani in confezione nera – marca non leggibile (Non identificata). Prodotto e prezzo incerti.',
  0, true, 'da_identificare',
  'Non identificabile con certezza dalla foto', 'Non identificabile con certezza dalla foto', 'Non determinabile: leggere etichetta', 'Non determinabile: leggere etichetta',
  'MS-CAT-28', NULL, 'Prodotto e prezzo incerti.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-29', 29, 'Condimento per pollo in confezione verde – marca non leggibile', 'Non identificata', 'Condimenti e dadi', 'Da accertare',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Confezione verde (peso da verificare)', 'realProd29', 'verified', 'Condimento per pollo in confezione verde – marca non leggibile (Non identificata). Prodotto non identificato con certezza.',
  0, true, 'da_identificare',
  'Miscela di spezie/aromi non identificata', 'Miscela di spezie/aromi non identificata', 'Non determinabile: leggere etichetta', 'Non determinabile: leggere etichetta',
  'MS-CAT-29', NULL, 'Prodotto non identificato con certezza.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-30', 30, 'Confezioni dorate di spezie/condimento – marca non leggibile', 'Non identificata', 'Spezie e aromi', 'Da accertare',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Confezioni dorate (peso da verificare)', 'realProd30', 'verified', 'Confezioni dorate di spezie/condimento – marca non leggibile (Non identificata). Prodotto non identificato con certezza.',
  0, true, 'da_identificare',
  'Miscela non identificata', 'Miscela non identificata', 'Non determinabile: leggere etichetta', 'Non determinabile: leggere etichetta',
  'MS-CAT-30', NULL, 'Prodotto non identificato con certezza.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-31', 31, 'Dark & Lovely Relaxer', 'Dark & Lovely', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd31', 'verified', 'Dark & Lovely Relaxer (Dark & Lovely). Prodotto riconoscibile; variante non chiara.',
  0, true, 'da_verificare',
  'Formula chimica per trattamento/relaxer; consultare confezione', 'Formula chimica per trattamento/relaxer; consultare confezione', 'Possibili profumi/conservanti; rischio irritazione. Seguire avvertenze e test indicato', 'Possibili profumi/conservanti; rischio irritazione. Seguire avvertenze e test indicato',
  'MS-CAT-31', NULL, 'Prodotto riconoscibile; variante non chiara.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-32', 32, 'Dark & Lovely Hair Treatment', 'Dark & Lovely', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd32', 'verified', 'Dark & Lovely Hair Treatment (Dark & Lovely). Variante non chiara.',
  0, true, 'da_verificare',
  'Trattamento capelli; formula da verificare', 'Trattamento capelli; formula da verificare', 'Possibili profumi/conservanti', 'Possibili profumi/conservanti',
  'MS-CAT-32', NULL, 'Variante non chiara.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-33', 33, 'Olive Oil Hair Products', 'Marca/variante non chiara', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd33', 'verified', 'Olive Oil Hair Products (Marca/variante non chiara). Linea visibile; singoli prodotti non distinguibili.',
  0, true, 'da_verificare',
  'Prodotti per capelli a base/tema olio d''oliva; ingredienti da verificare', 'Prodotti per capelli a base/tema olio d''oliva; ingredienti da verificare', 'Possibili profumi e conservanti', 'Possibili profumi e conservanti',
  'MS-CAT-33', NULL, 'Linea visibile; singoli prodotti non distinguibili.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-34', 34, 'B.B. Clear Cream', 'B.B. Clear', 'Cura della pelle', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd34', 'verified', 'B.B. Clear Cream (B.B. Clear). Prodotto visibile; formula non identificata.',
  0, true, 'da_verificare',
  'Crema cosmetica; ingredienti da verificare', 'Crema cosmetica; ingredienti da verificare', 'Possibili profumi/conservanti; verificare ingredienti e avvertenze', 'Possibili profumi/conservanti; verificare ingredienti e avvertenze',
  'MS-CAT-34', NULL, 'Prodotto visibile; formula non identificata.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-35', 35, 'Clairmen Products', 'Clairmen', 'Cura della pelle', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd35', 'verified', 'Clairmen Products (Clairmen). Linea visibile; prodotto esatto non chiaro.',
  0, true, 'da_verificare',
  'Prodotti cosmetici; ingredienti da verificare', 'Prodotti cosmetici; ingredienti da verificare', 'Possibili profumi/conservanti; verificare ingredienti e avvertenze', 'Possibili profumi/conservanti; verificare ingredienti e avvertenze',
  'MS-CAT-35', NULL, 'Linea visibile; prodotto esatto non chiaro.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-36', 36, 'Caro White Lotion', 'Caro White', 'Cura della pelle', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd36', 'verified', 'Caro White Lotion (Caro White). Prodotto visibile; etichetta non leggibile.',
  0, true, 'da_verificare',
  'Lozione cosmetica; ingredienti da verificare', 'Lozione cosmetica; ingredienti da verificare', 'Possibili profumi/conservanti; controllare conformità UE e ingredienti', 'Possibili profumi/conservanti; controllare conformità UE e ingredienti',
  'MS-CAT-36', NULL, 'Prodotto visibile; etichetta non leggibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-37', 37, 'Dettol Antiseptic', 'Dettol', 'Saponi e igiene', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd37', 'verified', 'Dettol Antiseptic (Dettol). Marchio riconoscibile; formulazione non identificata.',
  0, true, 'da_verificare',
  'Antisettico; formula varia per paese e formato', 'Antisettico; formula varia per paese e formato', 'Possibili ingredienti irritanti/allergizzanti; seguire etichetta e uso previsto', 'Possibili ingredienti irritanti/allergizzanti; seguire etichetta e uso previsto',
  'MS-CAT-37', NULL, 'Marchio riconoscibile; formulazione non identificata.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-38', 38, 'Tura Soap', 'Tura', 'Saponi e igiene', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd38', 'verified', 'Tura Soap (Tura). Prodotto visibile.',
  0, true, 'da_verificare',
  'Sapone; ingredienti da verificare', 'Sapone; ingredienti da verificare', 'Possibili profumi e conservanti', 'Possibili profumi e conservanti',
  'MS-CAT-38', NULL, 'Prodotto visibile.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-39', 39, 'Naomi Hair Products', 'Naomi', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Da verificare su confezione', 'realProd39', 'verified', 'Naomi Hair Products (Naomi). Prodotto/linea visibile; variante non chiara.',
  0, true, 'da_verificare',
  'Prodotti per capelli; ingredienti da verificare', 'Prodotti per capelli; ingredienti da verificare', 'Possibili profumi/conservanti', 'Possibili profumi/conservanti',
  'MS-CAT-39', NULL, 'Prodotto/linea visibile; variante non chiara.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-40', 40, '212 Perfume', 'Non chiara', 'Profumi', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Flacone (volume da verificare)', 'realProd40', 'verified', '212 Perfume (Non chiara). Confezione visibile; marca non certa.',
  0, true, 'da_verificare',
  'Profumo; formula INCI da verificare', 'Profumo; formula INCI da verificare', 'Profumi: possibili allergeni da fragranza, indicati in etichetta', 'Profumi: possibili allergeni da fragranza, indicati in etichetta',
  'MS-CAT-40', NULL, 'Confezione visibile; marca non certa.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-41', 41, 'Oli per capelli assortiti', 'Varie', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Assortimento (formati da verificare)', 'realProd41', 'verified', 'Oli per capelli assortiti (Varie). Gruppo di prodotti non distinguibile singolarmente.',
  0, true, 'da_verificare',
  'Oli cosmetici; ingredienti da verificare', 'Oli cosmetici; ingredienti da verificare', 'Possibili profumi/oli essenziali', 'Possibili profumi/oli essenziali',
  'MS-CAT-41', NULL, 'Gruppo di prodotti non distinguibile singolarmente.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
INSERT INTO public.products (
  id, item_number, name, brand, category, origin, price, observed_price, price_status, purchase_price, original_price,
  package_size, image, image_status, description, stock, is_available, verification_status, ingredients,
  expected_ingredients, allergen_info, allergens_alert, sku, barcode, notes, is_new_arrival, is_discounted
) VALUES (
  'prod-real-42', 42, 'Creme e trattamenti per capelli assortiti', 'Varie', 'Capelli e bellezza', 'Da verificare su etichetta',
  NULL, 'Non leggibile', 'unreadable', NULL, NULL,
  'Assortimento (formati da verificare)', 'realProd42', 'verified', 'Creme e trattamenti per capelli assortiti (Varie). Gruppo di prodotti non distinguibile singolarmente.',
  0, true, 'da_verificare',
  'Formule varie; ingredienti da verificare', 'Formule varie; ingredienti da verificare', 'Possibili profumi, conservanti e altri ingredienti', 'Possibili profumi, conservanti e altri ingredienti',
  'MS-CAT-42', NULL, 'Gruppo di prodotti non distinguibile singolarmente.', false, false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  observed_price = EXCLUDED.observed_price,
  verification_status = EXCLUDED.verification_status,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;
