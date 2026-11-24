import React, { useState, useRef } from 'react';
import { UploadCloud, Trash2, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck, Plus } from 'lucide-react';
import { isGenuineProductImage, resolveImage } from '../utils/imageHelper';

interface ImageUploadDropzoneProps {
  currentImage: string;
  imageStatus?: 'verified' | 'needs_review' | 'missing';
  onImageUploaded: (url: string) => void;
  onRemoveImage: () => void;
  onStatusChange?: (status: 'verified' | 'needs_review' | 'missing') => void;
  gallery?: string[];
  onGalleryChange?: (gallery: string[]) => void;
  authToken?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

async function compressImageToDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Impossibile leggere il file immagine.'));
    reader.readAsDataURL(file);
  });

  // Skip canvas re-encoding for small files (< 300KB) or AVIF (preserve server Sharp pipeline)
  if (file.size < 300 * 1024 || file.type === 'image/avif') {
    return rawDataUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image load error'));
      el.src = rawDataUrl;
    });

    const maxDim = 1200;
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;

    ctx.drawImage(img, 0, 0, width, height);
    const webpDataUrl = canvas.toDataURL('image/webp', 0.86);
    if (webpDataUrl.startsWith('data:image/webp') && webpDataUrl.length < rawDataUrl.length) {
      return webpDataUrl;
    }
    return rawDataUrl;
  } catch {
    return rawDataUrl;
  }
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  currentImage,
  imageStatus = 'missing',
  onImageUploaded,
  onRemoveImage,
  onStatusChange,
  gallery = [],
  onGalleryChange,
  authToken
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const hasValidPhoto = isGenuineProductImage(currentImage, imageStatus);
  const displaySrc = previewUrl || (hasValidPhoto ? resolveImage(currentImage) : null);

  const uploadFileToServer = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato non supportato: carica solo immagini JPEG, PNG, WebP o AVIF.');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('File troppo grande: dimensione massima consentita 8MB.');
    }

    onProgress?.(30);
    const optimizedBase64 = await compressImageToDataUrl(file);
    onProgress?.(65);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dataBase64: optimizedBase64,
        filename: file.name
      })
    });

    onProgress?.(90);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Caricamento immagine non riuscito.');
    }
    onProgress?.(100);
    return data.url;
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      const uploadedUrl = await uploadFileToServer(file, setUploadProgress);
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(null);
      onImageUploaded(uploadedUrl);
      if (onStatusChange) {
        onStatusChange('verified');
      }
    } catch (err: any) {
      setPreviewUrl(null);
      setErrorMessage(err.message || 'Errore di rete durante il caricamento.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onGalleryChange) return;

    setErrorMessage(null);
    setIsGalleryUploading(true);
    try {
      const uploadedUrl = await uploadFileToServer(file);
      onGalleryChange([...gallery, uploadedUrl]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore caricamento immagine secondaria.');
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700 text-xs">
          Fotografia Autentica Prodotto
        </label>
        
        {onStatusChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Stato foto:</span>
            <select
              value={imageStatus}
              onChange={(e) => onStatusChange(e.target.value as any)}
              className="text-[11px] font-semibold rounded-md border border-stone-300 py-0.5 px-2 bg-white"
            >
              <option value="verified">Foto Autentica Verificata</option>
              <option value="needs_review">Da Controllare</option>
              <option value="missing">Mancante / Placeholder</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Upload Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${
          isDragging
            ? 'border-emerald-600 bg-emerald-50/60'
            : displaySrc
            ? 'border-stone-300 bg-stone-50'
            : 'border-stone-300 bg-white hover:border-emerald-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />

        {displaySrc ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-white border border-stone-200 shadow-xs">
              <img
                src={displaySrc}
                alt="Anteprima prodotto"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {imageStatus === 'verified' && (
                <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs" title="Foto Verificata">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
              {imageStatus === 'needs_review' && (
                <span className="absolute bottom-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Da Controllare">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <p className="font-semibold text-xs text-slate-800">
                  Foto individuale associata al prodotto
                </p>
                <p className="text-[11px] text-slate-500">
                  Formato WebP ottimizzato · Metadati EXIF rimossi
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>Sostituisci Foto</span>
                </button>

                <button
                  type="button"
                  onClick={onRemoveImage}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rimuovi</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-semibold text-xs text-slate-800">
              Clicca per caricare o trascina la foto reale del prodotto
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPEG, PNG, WebP, AVIF fino a 8MB · Ottimizzazione automatica in WebP
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Solo immagini reali del prodotto</span>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Compressione e caricamento in WebP...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Additional Gallery Images Section */}
      {onGalleryChange && (
        <div className="pt-2 border-t border-stone-200">
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleGalleryFileChange}
          />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700">Galleria Aggiuntiva ({gallery.length})</span>
            <button
              type="button"
              disabled={isGalleryUploading}
              onClick={() => galleryInputRef.current?.click()}
              className="text-[11px] text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              <span>{isGalleryUploading ? 'Caricamento...' : 'Carica Altra Foto (Retro / Etichetta)'}</span>
            </button>
          </div>
          {gallery.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {gallery.map((imgUrl, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0 group">
                  <img src={resolveImage(imgUrl)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = gallery.filter((_, i) => i !== idx);
                      onGalleryChange(updated);
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Rimuovi foto galleria"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
