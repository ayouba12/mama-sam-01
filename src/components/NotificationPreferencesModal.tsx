import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Sparkles, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PushTopics } from '../hooks/usePushNotifications';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  topics: PushTopics;
  onSubscribe: (topics: PushTopics) => Promise<boolean>;
  onUpdateTopics: (topics: PushTopics) => Promise<void>;
  onUnsubscribe: () => Promise<void>;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  isSupported,
  permission,
  isSubscribed,
  isLoading,
  error,
  topics,
  onSubscribe,
  onUpdateTopics,
  onUnsubscribe
}) => {
  const [localTopics, setLocalTopics] = useState<PushTopics>(topics);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setLocalTopics(topics);
  }, [topics, isOpen]);

  if (!isOpen) return null;

  const handleToggleTopic = (key: keyof PushTopics) => {
    const next = { ...localTopics, [key]: !localTopics[key] };
    setLocalTopics(next);
    if (isSubscribed) {
      onUpdateTopics(next).then(() => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
      });
    }
  };

  const handleActivate = async () => {
    if (!localTopics.newArrivals && !localTopics.storeHours) {
      return;
    }
    const ok = await onSubscribe(localTopics);
    if (ok) {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-fast">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-slide-up-mobile">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#124b2e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Notifiche Mama Sam</h3>
              <p className="text-[11px] text-emerald-200">Aggiornamenti diretti dal negozio di Messina</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/70 transition-colors cursor-pointer"
            aria-label="Chiudi impostazioni notifiche"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!isSupported ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Browser non compatibile</p>
                <p className="leading-relaxed">
                  Il tuo browser o la finestra corrente non supportano le notifiche push Web. Prova da Chrome, Edge o Safari su dispositivo mobile (aggiungendo l’app alla schermata Home).
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scegli quali avvisi vuoi ricevere sul tuo dispositivo. Nessuno spam: inviamo solo aggiornamenti utili dal banco.
              </p>

              {/* Topic Toggles */}
              <div className="space-y-2.5">
                <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#124b2e] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Nuovi Arrivi &amp; Prodotti Freschi
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Avviso quando arrivano yam freschi, platani, pesce affumicato e nuove importazioni.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localTopics.newArrivals}
                    onChange={() => handleToggleTopic('newArrivals')}
                    className="w-4 h-4 accent-[#124b2e] mt-1 shrink-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Variazioni Orari &amp; Aperture
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Avviso immediato in caso di cambi orario festivi o aperture straordinarie in Via Ugo Bassi 104.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localTopics.storeHours}
                    onChange={() => handleToggleTopic('storeHours')}
                    className="w-4 h-4 accent-[#124b2e] mt-1 shrink-0 cursor-pointer"
                  />
                </label>
              </div>

              {permission === 'denied' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Le notifiche risultano bloccate nelle impostazioni del browser. Consenti le notifiche per questo sito e riprova.
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {error}
                </div>
              )}

              {savedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Preferenze salvate! Riceverai gli aggiornamenti selezionati.</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {!isSubscribed ? (
                  <button
                    type="button"
                    disabled={isLoading || (!localTopics.newArrivals && !localTopics.storeHours)}
                    onClick={handleActivate}
                    className="w-full py-2.5 px-4 bg-[#124b2e] hover:bg-[#0e3b24] disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-amber-300" />
                    <span>{isLoading ? 'Attivazione in corso...' : 'Attiva Notifiche Browser'}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Notifiche push attive su questo dispositivo</span>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={onUnsubscribe}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Disattiva</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
