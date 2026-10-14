import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { resolveImage } from '../utils/imageHelper';

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

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  currentImage,
  imageStatus = 'verified',
  onImageUploaded,
  onRemoveImage,
  onStatusChange,
  gallery = [],
  onGalleryChange,
  authToken
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displaySrc = previewUrl || (currentImage ? resolveImage(currentImage) : null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Client-side quick checks
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Format rejected: Only JPEG, PNG, or WebP images are permitted (SVG, HTML, or executables rejected).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('File size too large: Maximum upload size is 8MB.');
      return;
    }

    // Set local immediate preview for responsive admin UX
    const localReader = new FileReader();
    localReader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    localReader.readAsDataURL(file);

    // Read as Base64 for secure transmission and server-side magic byte & Sharp inspection
    setIsUploading(true);
    setUploadProgress(25);

    try {
      const base64Reader = new FileReader();
      base64Reader.onload = async () => {
        const base64String = base64Reader.result as string;
        setUploadProgress(60);

        try {
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
              dataBase64: base64String,
              filename: file.name
            })
          });

          setUploadProgress(90);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          setUploadProgress(100);
          setPreviewUrl(null);
          onImageUploaded(data.url);
          if (onStatusChange) {
            onStatusChange('needs_review'); // Mark for admin visual verification
          }
        } catch (err: any) {
          setPreviewUrl(null);
          setErrorMessage(err.message || 'Network error during image upload.');
        } finally {
          setIsUploading(false);
        }
      };

      base64Reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      setPreviewUrl(null);
      setErrorMessage(err.message || 'Failed to read image file.');
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
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700 text-xs">
          Product Photography &amp; Status
        </label>
        
        {/* Image status badges */}
        {onStatusChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Accuracy:</span>
            <select
              value={imageStatus}
              onChange={(e) => onStatusChange(e.target.value as any)}
              className="text-[11px] font-semibold rounded-md border border-stone-300 py-0.5 px-2 bg-white"
            >
              <option value="verified">Verified (Accurate Photo)</option>
              <option value="needs_review">Needs Review</option>
              <option value="missing">Missing / Placeholder</option>
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
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {displaySrc ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Thumbnail */}
            <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-white border border-stone-200 shadow-xs">
              <img
                src={displaySrc}
                alt="Product Preview"
                className="w-full h-full object-cover"
              />
              {imageStatus === 'verified' && (
                <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs" title="Photo Verified">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
              {imageStatus === 'needs_review' && (
                <span className="absolute bottom-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Needs Admin Review">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {/* Actions for current image */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <p className="font-semibold text-xs text-slate-800">
                  {currentImage.startsWith('/api/uploads/')
                    ? 'Uploaded Custom Photo'
                    : 'Authentic Mama Sam Catalog Image'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Protected raster format · Stripped EXIF · WebP Optimized
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
                  <span>Replace Photo</span>
                </button>

                <button
                  type="button"
                  onClick={onRemoveImage}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty dropzone state */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-semibold text-xs text-slate-800">
              Click to select photo or drag and drop
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPEG, PNG, WebP up to 8MB · Mobile camera uploads supported
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Strict format &amp; EXIF validation</span>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Validating &amp; optimizing image...</span>
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

      {/* Additional Gallery Images Section (if supported) */}
      {onGalleryChange && (
        <div className="pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700">Secondary Product Gallery ({gallery.length})</span>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter additional photo URL or upload standard item:');
                if (url && url.trim()) {
                  onGalleryChange([...gallery, url.trim()]);
                }
              }}
              className="text-[10px] text-emerald-800 font-bold hover:underline"
            >
              + Add Gallery Angle
            </button>
          </div>
          {gallery.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {gallery.map((imgUrl, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0 group">
                  <img src={resolveImage(imgUrl)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = gallery.filter((_, i) => i !== idx);
                      onGalleryChange(updated);
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
