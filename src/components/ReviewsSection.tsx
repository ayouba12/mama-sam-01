import React from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';
import { Review } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews }) => {
  return (
    <section id="reviews-section" className="py-12 sm:py-16 bg-[#faf9f5] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase block mb-1">
              Feedback dei Clienti
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Amato dalla Nostra Comunità a Messina
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="font-extrabold text-2xl text-slate-900">5.0</span>
            <div>
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Basato su recensioni verificate Google</p>
            </div>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Author & Stars */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                      {rev.author}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rev.stats}
                    </p>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(Math.max(0, Math.min(5, Math.floor(rev.rating || 5))))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed italic mb-4">
                  {rev.content}
                </p>
              </div>

              {/* Optional Store Response */}
              {rev.storeResponse && (
                <div className="pt-3 border-t border-stone-100 bg-stone-50/70 p-3 rounded-xl mt-2 text-[11.5px] text-slate-600">
                  <p className="font-semibold text-emerald-800 text-[11px] mb-0.5">
                    Risposta da Mama Sam:
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    {rev.storeResponse.replace('Risposta da Mama Sam: ', '').replace('Response from Mama Sam: ', '')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
