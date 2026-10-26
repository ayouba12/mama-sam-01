-- ====================================================================
-- MAMA SAM SUPERMARKET - SUPABASE SEED DATA
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

-- 2. Categories
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-1', 'Tuberi e Verdure Fresche', 'Yam, Platani, Manioca e Peperoncini Scotch Bonnet', 'catTubers', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-2', 'Cereali e Farine Tradizionali', 'Garri Ijebu, Farina di Yam, Riso e Fagioli', 'catGrains', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-3', 'Pesce Affumicato e Carni', 'Pesce Gatto Affumicato, Stoccafisso e Carne di Capra', 'catFishMeats', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-4', 'Spezie e Olio di Palma', 'Olio di Palma Puro, Dadi Maggi, Egusi e Suya', 'catSpicesOil', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-5', 'Bevande al Malto e Ibisco', 'Malta Guinness, Supermalt e Succo di Zobo', 'catMaltDrinks', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-6', 'Snack e Dolci Caraibici', 'Chin Chin Croccante, Chips di Platano e Jamaican Patty', 'catSnacks', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;
INSERT INTO public.categories (id, name, summary, image, item_count)
VALUES ('cat-7', 'Cura Afro e Cosmetici', 'Burro di Karité Grezzo, Sapone Nero Dudu-Osun e Extension', 'catCosmetics', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, image = EXCLUDED.image;

-- 3. Products
INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-1', 'Burro di Karité Grezzo d''Avorio Puro 100%', 'Cura Afro e Cosmetici', 'Tamale, Ghana', 6.9, 8, 'Confezione da 500g', 'sheaButter', 'verified', 'Burro di karité ghanese grezzo e non raffinato di Grado A da Tamale. Nutre in profondità la pelle secca, ammorbidisce i ricci e protegge il cuoio capelluto.', 24, true, false, '', '', '{}'::jsonb, '', false, true, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-2', 'Farina di Yam Pounded Ayoola (Iyan)', 'Cereali e Farine Tradizionali', 'Nigeria', 5.8, NULL, 'Busta richiudibile da 1 kg', 'yamFlour', 'verified', 'Farina istantanea di yam pestato per preparare l''autentico swallow nigeriano liscio e vellutato. Si prepara in acqua bollente in meno di 5 minuti senza grumi.', 35, true, false, '', '', '{}'::jsonb, '', true, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-3', 'Yam Bianco Africano Fresco (Puna Yam)', 'Tuberi e Verdure Fresche', 'Ghana / Nigeria', 6.9, 7.5, 'Tubero da circa 2,5 kg', 'punaYam', 'verified', 'Pregiato yam bianco puna del Ghana dalla consistenza morbida, dolce e farinosa. Perfetto da bollire, friggere a fette o gustare con salsa d''uovo e peperoncino.', 18, true, false, '', '', '{}'::jsonb, '', false, true, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-4', 'Garri Ijebu Premium - Fiocchi di Manioca', 'Cereali e Farine Tradizionali', 'Ogun State, Nigeria', 6.5, 7.2, 'Sacco da 2 kg', 'ijebuGarri', 'verified', 'Fiocchi di manioca bianca finemente setacciati e fermentati secondo la tradizione Ijebu, con la tipica nota acidula e croccante. Ideale per ammollo con arachidi o per preparare l''eba calda.', 40, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-5', 'Dadi di Condimento Maggi Star (100 pz)', 'Spezie e Olio di Palma', 'Costa d''Avorio', 4, NULL, 'Scatola da 100 cubetti (400g)', 'maggiCubes', 'verified', 'I celebri cubetti di brodo arricchiti dell''Africa Occidentale. Indispensabili per preparare riso jollof, zuppe di pepe, stufati di carne e salse di verdura.', 55, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-6', 'Malta Guinness Bevanda al Malto (6x330ml)', 'Bevande al Malto e Ibisco', 'Guinness Nigeria / Camerun', 8.5, 9.6, '6 lattine da 330ml', 'maltaGuinness', 'verified', 'Bevanda analcolica al malto ricca e rinvigorente, arricchita con vitamine B1, B2, B3, B5, B6 e calcio. Perfetta servita ghiacciata.', 30, true, false, '', '', '{}'::jsonb, '', false, true, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-7', 'Chin Chin Croccante alla Vaniglia Mama Sam', 'Snack e Dolci Caraibici', 'Laboratorio Mama Sam, Messina', 3.5, NULL, 'Barattolo da 350g', 'chinChin', 'verified', 'Bocconcini croccanti di pasticceria tipica dell''Africa Occidentale cotti freschi, aromatizzati con noce moscata, cannella e vaniglia. Fatti con passione a Messina.', 22, true, false, '', '', '{}'::jsonb, '', true, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-8', 'Olio di Palma Rosso Puro Extra Vergine (1L)', 'Spezie e Olio di Palma', 'Edo State, Nigeria', 5.5, 6.2, 'Bottiglia da 1 Litro', 'palmOil1L', 'verified', '100% puro olio di palma rosso vergine estratto a freddo, dal colore rubino brillante e dall''aroma rustico intenso. Fondamentale per zuppa egusi, oha e banga.', 45, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-9', 'Platani Gialli Dolci (Maturi)', 'Tuberi e Verdure Fresche', 'Camerun / Costa Rica', 3.2, NULL, 'Casco da 1 kg (~4 platani)', 'yellowPlantains', 'verified', 'Platani gialli maturati al punto giusto, ideali da friggere dorati per il dodo caramellato, da bollire o da servire con fagioli e riso jollof.', 28, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-10', 'Pesce Gatto Intero Essiccato e Affumicato', 'Pesce Affumicato e Carni', 'Nigeria / Atlantico', 8.9, 9.8, 'Intero da circa 350g', 'smokedCatfish', 'verified', 'Pesce gatto africano affumicato a legno duro, dal profumo intenso e carni tenere e saporite. Arricchisce zuppe di egusi, edikang ikong e bitterleaf.', 15, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-11', 'Riso Aromatico a Chicco Lungo Parboiled', 'Cereali e Farine Tradizionali', 'Ghana / Thailandia', 11.5, NULL, 'Sacco da 5 kg', 'longGrainRice', 'verified', 'Riso parboiled a chicco lungo di prima qualità: resta sgranato, morbido e profumato. La scelta ideale per il jollof rice nigeriano e ghanese.', 32, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-12', 'Tranci di Stoccafisso Artico Essiccato (Cod)', 'Pesce Affumicato e Carni', 'Norvegia / Nigeria', 13.5, NULL, 'Tagli scelti da 400g', 'stockfishCuts', 'verified', 'Vero merluzzo artico norvegese essiccato all''aria (okporoko / panla). Tranci spessi che donano corpo, aroma e collagene ineguagliabile alle zuppe tradizionali.', 16, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-13', 'Patties Giamaicane di Manzo Speziato (2 pz)', 'Snack e Dolci Caraibici', 'Giamaica / UK', 4.8, NULL, 'Confezione da 2 x 140g', 'jamaicanPatty', 'verified', 'Fagottini dorati di pasta sfogliata alla curcuma ripieni di carne macinata di manzo cotta a fuoco lento con scotch bonnet, timo e cipollotti freschi.', 20, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-14', 'Chips Croccanti di Platano Salato al Peperoncino', 'Snack e Dolci Caraibici', 'Ghana', 2.2, NULL, 'Busta da 120g', 'plantainChips', 'verified', 'Platani verdi tagliati sottilissimi e fritti in pentola fino a raggiungere la massima croccantezza, cosparsi di sale marino e peperoncino.', 50, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-15', 'Fiori di Ibisco Essiccati per Zobo / Carcadè', 'Bevande al Malto e Ibisco', 'Nigeria / Sudan', 3.9, NULL, 'Busta da 300g', 'zoboHibiscus', 'verified', 'Calici interi biologici di Hibiscus sabdariffa essiccati al sole per preparare la rinfrescante bevanda Zobo o il tradizionale Sorrel caraibico.', 38, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-16', 'Sapone Nero Africano Dudu-Osun (Pacco da 3)', 'Cura Afro e Cosmetici', 'Nigeria', 5.5, NULL, '3 saponette da 150g', 'blackSoap', 'verified', 'Sapone artigianale a base di erbe naturali, miele puro, burro di karité, legno di camwood e cenere di baccelli di cacao. Lenitivo e purificante.', 42, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-17', 'Peperoncini Scotch Bonnet Rossi e Gialli Freschi', 'Tuberi e Verdure Fresche', 'Uganda / Nigeria', 2.8, NULL, 'Vaschetta da 250g', 'scotchBonnets', 'verified', 'Piccantissimi e profumatissimi peperoncini atarodo/habanero freschi, con la caratteristica nota floreale e fruttata. Arrivati freschi a Messina.', 25, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-18', 'Okra Fresca e Tenera (Gombo)', 'Tuberi e Verdure Fresche', 'Ghana', 3.5, NULL, 'Vaschetta da 500g', 'freshOkra', 'verified', 'Baccelli di gombo freschissimi e croccanti per preparare la zuppa cremosa Ila Alasepo, gumbo o stufati leggeri di verdure.', 20, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-19', 'Radici Fresche di Manioca Cerata (Yuca)', 'Tuberi e Verdure Fresche', 'Costa Rica / Nigeria', 3.8, NULL, 'Pezzo da circa 1,2 kg', 'cassavaRoots', 'verified', 'Radici fresche di manioca a polpa bianca protette da paraffina naturale. Ottime bollite con salsa di peperoni, arrostite o fritte croccanti.', 19, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-20', 'Platani Verdi Aceri (Da Bollire o Friggere)', 'Tuberi e Verdure Fresche', 'Camerun', 2.9, NULL, 'Casco da 1 kg', 'greenPlantains', 'verified', 'Platani verdi compatti e ricchi di fibre resistenti. Perfetti per platano bollito a basso indice glicemico, tostones caraibici o zuppe di porridge.', 24, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-21', 'Fagioli Miele Oloyin Nigeriani (Ewa Oloyin)', 'Cereali e Farine Tradizionali', 'Nigeria', 4.9, NULL, 'Busta da 1 kg', 'honeyBeans', 'verified', 'Fagioli bruni naturalmente dolci (Ewa Oloyin). Diventano morbidissimi e burrosi durante la cottura, ideali per stufato con platani e moi moi.', 34, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-22', 'Garri Giallo all''Olio di Palma (Per Eba)', 'Cereali e Farine Tradizionali', 'Nigeria', 6.2, NULL, 'Sacco da 2 kg', 'yellowGarri', 'verified', 'Fiocchi di manioca tradizionali arricchiti con olio di palma vergine durante la tostatura. Donano all''eba un caldo colore dorato e consistenza vellutata.', 26, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-23', 'Latta Famiglia Olio di Palma Rosso Puro (5L)', 'Spezie e Olio di Palma', 'Nigeria', 23.5, NULL, 'Fusto metallico da 5 Litri', 'palmOil5L', 'verified', 'Formato scorta famigliare di olio di palma rosso vergine non filtrato 100% originale. Ricchissimo di betacarotene e con lunga conservazione.', 14, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-24', 'Crayfish Intero Essiccato al Sole di Calabar', 'Spezie e Olio di Palma', 'Calabar, Nigeria', 5.2, NULL, 'Barattolo da 200g', 'crayfish', 'verified', 'Gamberetti selvatici di mare affumicati ed essiccati al sole sulla costa di Calabar. Insostituibile condimento ad alto tenore umami per le salse africane.', 36, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-25', 'Supermalt Originale Bevanda al Malto (4x330ml)', 'Bevande al Malto e Ibisco', 'Danimarca / Export', 6.2, NULL, '4 bottiglie in vetro da 330ml', 'supermalt', 'verified', 'La classica bevanda analcolica al malto d''orzo e luppolo, ricca di vitamine del gruppo B. Nutriente, vellutata e dissetante.', 28, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-26', 'Carne di Capra Fresca a Bocconcini (Halal)', 'Pesce Affumicato e Carni', 'Macelleria Halal Siciliana', 11.9, NULL, 'Vaschetta macelleria da 1 kg', 'goatMeat', 'verified', 'Bocconcini con osso di carne di capra fresca certificata halal, perfetta per pepper soup nigeriana, curry di capra o spezzatini al pomodoro.', 12, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-27', 'Vino di Palma Naturale Tradizionale (1L)', 'Bevande al Malto e Ibisco', 'Ghana / Nigeria', 5.9, NULL, 'Bottiglia da 1 Litro', 'palmWine', 'verified', 'Linfa dolce naturalmente fermentata ricavata dalle palme da olio. Frizzante, aromatica e tradizionalmente servita durante festività e visite famigliari.', 15, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-28', 'Semi di Mango Selvatico Ogbono (Apon)', 'Spezie e Olio di Palma', 'Nigeria', 6.8, NULL, 'Barattolo da 250g', 'ogbonoSeeds', 'verified', 'Pregiati semi di mango della foresta (ogbono) selezionati per preparare la densa, filante e saporitissima draw soup tradizionale.', 22, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-29', 'Extension per Treccine X-Pression Ultra Braid (82")', 'Cura Afro e Cosmetici', 'Nigeria / Togo', 4.5, NULL, 'Matassa lunghezza 82 pollici', 'braidingHair', 'verified', 'Fibra sintetica Kanekalon 100% per trecce. Leggera, anti-nodi e fissabile in acqua calda per box braids, treccine aderenti e twist.', 60, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

INSERT INTO public.products (
  id, name, category, origin, price, original_price, package_size, image, image_status, description, stock, is_available, featured, ingredients, allergen_info, dietary_info, sku, is_new_arrival, is_discounted, discount_active, discount_start_date, discount_end_date
) VALUES (
  'prod-30', 'Miscela di Spezie per Suya Yaji Hausa', 'Spezie e Olio di Palma', 'Kano, Nigeria', 4.2, NULL, 'Spargitore da 150g', 'suyaSpice', 'verified', 'Autentico mix di spezie per spiedini Suya del nord della Nigeria con kuli-kuli di arachidi tostate, zenzero, peperoncino e chiodi di garofano. Esalta carne alla griglia e pollo.', 44, true, false, '', '', '{}'::jsonb, '', false, false, true, NULL, NULL
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, is_available = EXCLUDED.is_available;

