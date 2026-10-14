import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  Leaf, 
  Calendar,
  FileCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProductDietaryInfo, AllergenKey, AllergenPresence } from '../types';
import { EU_ALLERGENS, ALLERGEN_STATUS_LABELS, createDefaultDietaryInfo } from '../utils/allergenHelper';

interface AdminAllergenEditorProps {
  value?: ProductDietaryInfo;
  onChange: (updated: ProductDietaryInfo) => void;
}

export const AdminAllergenEditor: React.FC<AdminAllergenEditorProps> = ({
  value,
  onChange
}) => {
  const dietary: ProductDietaryInfo = value || createDefaultDietaryInfo();

  const handleAllergenStatusChange = (key: AllergenKey, status: AllergenPresence) => {
    const nextAllergens = { ...dietary.allergens };
    nextAllergens[key] = {
      ...(nextAllergens[key] || {}),
      status
    };
    onChange({
      ...dietary,
      allergens: nextAllergens
    });
  };

  const handleAllergenDetailChange = (key: AllergenKey, specificDetails: string) => {
    const nextAllergens = { ...dietary.allergens };
    nextAllergens[key] = {
      ...(nextAllergens[key] || { status: 'not_declared' }),
      specificDetails
    };
    onChange({
      ...dietary,
      allergens: nextAllergens
    });
  };

  return (
    <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border-2 border-amber-300 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Allergeni &amp; Informazioni Dietetiche</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                Reg. UE 1169/2011
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Gestisci dichiarazioni allergeni regolamentati, rischio contaminazione crociata e certificazioni
            </p>
          </div>
        </div>

        {/* Verification Status Selector */}
        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Stato Verifica:</span>
          <select
            value={dietary.verificationStatus || 'unverified'}
            onChange={e => onChange({ ...dietary, verificationStatus: e.target.value as any })}
            className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
          >
            <option value="unverified">⚠️ Da Verificare</option>
            <option value="label_inspected">🔍 Etichetta Esaminata</option>
            <option value="supplier_confirmed">✅ Confermato da Fornitore</option>
          </select>
        </div>
      </div>

      {/* Regulated Allergens Notice */}
      <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">Nota Sicurezza Alimentare:</p>
          <p className="text-[11px] leading-relaxed text-amber-900">
            Non presumere mai l'assenza di allergeni. <strong>"Non dichiarato"</strong> indica che non è menzionato in etichetta; selezionare <strong>"Certificato Assente"</strong> solo se analisi di laboratorio o schede tecniche del fornitore ne confermano l'assenza.
          </p>
        </div>
      </div>

      {/* 14 EU Regulated Allergens Grid */}
      <div className="space-y-3">
        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
          <span>I 14 Allergeni Regolamentati UE</span>
          <span className="text-[11px] font-normal text-slate-500">Seleziona lo stato per ciascun allergene</span>
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {EU_ALLERGENS.map(meta => {
            const currentItem = dietary.allergens?.[meta.key] || { status: 'not_declared', specificDetails: '' };
            const status = currentItem.status || 'not_declared';
            const isContains = status === 'contains';
            const isMayContain = status === 'may_contain';
            const isAbsent = status === 'verified_absent';

            return (
              <div
                key={meta.key}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  isContains ? 'bg-rose-50/80 border-rose-300 shadow-2xs' :
                  isMayContain ? 'bg-amber-50/80 border-amber-300 shadow-2xs' :
                  isAbsent ? 'bg-emerald-50/60 border-emerald-300' :
                  'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <strong className="block font-bold text-slate-900 text-xs">
                      {meta.label}
                    </strong>
                    <span className="text-[10.5px] text-slate-400 block leading-tight">
                      {meta.description}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] shrink-0 ${ALLERGEN_STATUS_LABELS[status].badgeClass}`}>
                    {status === 'contains' ? 'Contiene' :
                     status === 'may_contain' ? 'Può contenere' :
                     status === 'verified_absent' ? 'Assente' : 'Non dichiarato'}
                  </span>
                </div>

                {/* Status Selection Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAllergenStatusChange(meta.key, 'contains')}
                    className={`px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-center transition-all cursor-pointer border ${
                      isContains
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white hover:bg-rose-50 text-slate-700 border-stone-200'
                    }`}
                  >
                    Contiene
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAllergenStatusChange(meta.key, 'may_contain')}
                    className={`px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-center transition-all cursor-pointer border ${
                      isMayContain
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white hover:bg-amber-50 text-slate-700 border-stone-200'
                    }`}
                  >
                    Può contenere
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAllergenStatusChange(meta.key, 'not_declared')}
                    className={`px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-center transition-all cursor-pointer border ${
                      status === 'not_declared'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                        : 'bg-white hover:bg-stone-100 text-slate-700 border-stone-200'
                    }`}
                  >
                    Non dichiarato
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAllergenStatusChange(meta.key, 'verified_absent')}
                    className={`px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-center transition-all cursor-pointer border ${
                      isAbsent
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 border-stone-200'
                    }`}
                  >
                    Assente verificato
                  </button>
                </div>

                {/* Detail Input if Applicable */}
                {meta.hasDetailInput && (isContains || isMayContain) && (
                  <div className="mt-2 pt-2 border-t border-stone-200/70">
                    <input
                      type="text"
                      value={currentItem.specificDetails || ''}
                      onChange={e => handleAllergenDetailChange(meta.key, e.target.value)}
                      placeholder={meta.detailPlaceholder || 'Specifica dettagli...'}
                      className="w-full px-2.5 py-1 text-[11px] bg-white border border-stone-300 rounded-lg focus:border-[#124b2e] outline-hidden"
                    />
                    {meta.commonExamples && (
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-slate-400">
                        <span>Scelta rapida:</span>
                        {meta.commonExamples.map(ex => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => handleAllergenDetailChange(meta.key, ex)}
                            className="text-emerald-700 hover:underline font-medium cursor-pointer"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dietary Suitability & Intolerances */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-4">
        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Idoneità Dietetica &amp; Intolleranze</span>
        </h5>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={Boolean(dietary.vegan)}
              onChange={e => onChange({ ...dietary, vegan: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Vegano</span>
              <span className="text-[10px] text-slate-500">100% vegetale</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={Boolean(dietary.vegetarian)}
              onChange={e => onChange({ ...dietary, vegetarian: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Vegetariano</span>
              <span className="text-[10px] text-slate-500">Senza carne o pesce</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={Boolean(dietary.halal)}
              onChange={e => onChange({ ...dietary, halal: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Certificato Halal</span>
              <span className="text-[10px] text-slate-500">Conformità Halal</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={Boolean(dietary.glutenFreeClaim)}
              onChange={e => onChange({ ...dietary, glutenFreeClaim: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Senza Glutine</span>
              <span className="text-[10px] text-slate-500">Certificato o naturalmente privo</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={Boolean(dietary.lactoseFreeClaim)}
              onChange={e => onChange({ ...dietary, lactoseFreeClaim: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Senza Lattosio</span>
              <span className="text-[10px] text-slate-500">Zero lattosio</span>
            </div>
          </label>
        </div>

        {/* Intolerances Text Input */}
        <div>
          <label className="block font-bold text-slate-700 text-xs mb-1">
            Note su Intolleranze e Dieta
          </label>
          <input
            type="text"
            value={dietary.intoleranceNotes || ''}
            onChange={e => onChange({ ...dietary, intoleranceNotes: e.target.value })}
            placeholder="es. Tuberi di manioca naturalmente privi di glutine; lavorati in mulino non dedicato"
            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
          />
        </div>
      </div>

      {/* Advisory Warnings & Documentation Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Avvertenza Breve
          </label>
          <input
            type="text"
            value={dietary.warningNote || ''}
            onChange={e => onChange({ ...dietary, warningNote: e.target.value })}
            placeholder="es. Confezionato in stabilimento che tratta arachidi e semi di sesamo"
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Fonte Informazioni &amp; Documentazione
          </label>
          <input
            type="text"
            value={dietary.infoSource || ''}
            onChange={e => onChange({ ...dietary, infoSource: e.target.value })}
            placeholder="es. Etichetta confezione produttore / Scheda tecnica fornitore"
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Data Ultima Revisione
          </label>
          <input
            type="date"
            value={dietary.lastReviewedDate || new Date().toISOString().split('T')[0]}
            onChange={e => onChange({ ...dietary, lastReviewedDate: e.target.value })}
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
          />
        </div>
      </div>

    </div>
  );
};
