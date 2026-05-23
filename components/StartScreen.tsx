/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { UploadCloud, Sparkles, Palette, SlidersHorizontal, Camera, Wand2 } from 'lucide-react';

interface StartScreenProps {
  onFileSelect: (files: FileList | null, mode: 'ai' | 'lightroom') => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [selectedMode, setSelectedMode] = useState<'ai' | 'lightroom'>('ai');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files, selectedMode);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    onFileSelect(e.dataTransfer.files, selectedMode);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-6 sm:p-10 transition-all duration-300 rounded-3xl border ${
        isDraggingOver 
          ? selectedMode === 'ai' 
            ? 'bg-indigo-500/5 border-indigo-500/40 shadow-2xl shadow-indigo-500/10' 
            : 'bg-amber-500/5 border-amber-500/40 shadow-2xl shadow-amber-500/10'
          : 'border-transparent'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-7 animate-fade-in">
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs font-bold tracking-widest text-gray-300 uppercase select-none">
          <Sparkles className={`w-3.5 h-3.5 animate-pulse ${selectedMode === 'ai' ? 'text-indigo-400' : 'text-amber-500'}`} />
          <span>POWERED BY <span className={`font-black ${selectedMode === 'ai' ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent' : 'text-amber-500'}`}>ZEXAN</span></span>
        </div>

        {/* Dynamic Headers based on Choice */}
        <div className="flex flex-col items-center gap-2 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#f3f4f6] leading-tight">
            {selectedMode === 'ai' ? (
              <>
                AI-Powered Laboratory, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">Redetermined</span>.
              </>
            ) : (
              <>
                Classical Darkroom, <span className="text-amber-500 font-extrabold font-mono">PRO LIGHTROOM</span>.
              </>
            )}
          </h1>
          <p className="text-sm md:text-base text-gray-400/95 leading-relaxed font-normal mt-2">
            {selectedMode === 'ai' 
              ? "Re-imagine your photos using Gemini generative magic. Touch parts of your canvas to replace objects, re-light structures, or apply dreamy visual prompts." 
              : "High-precision physical rendering engine. Enjoy absolute manual detail adjustments, professional curves, Split-Toning grading, analog grains, and 60fps local rendering."}
          </p>
        </div>

        {/* INTERACTIVE ENGINE MODE CHOOSER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
          
          {/* Card A: Generative AI */}
          <button
            type="button"
            onClick={() => setSelectedMode('ai')}
            className={`p-5 rounded-2xl border text-left flex gap-4 transition-all duration-300 relative select-none ${
              selectedMode === 'ai'
                ? 'bg-indigo-500/[0.04] border-indigo-400/70 shadow-[0_4px_24px_rgba(99,102,241,0.15)] scale-[1.01]'
                : 'bg-[#111214]/60 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#131416]/80'
            }`}
          >
            <div className={`p-3 rounded-xl flex items-center justify-center h-12 w-12 shrink-0 ${
              selectedMode === 'ai' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-gray-800/40 text-gray-500'
            }`}>
              <Wand2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-xs font-bold uppercase tracking-widest ${selectedMode === 'ai' ? 'text-indigo-400' : 'text-gray-400'}`}>
                Generative AI Lab
              </span>
              <span className="text-[13px] font-bold text-gray-200">Creative Re-imaging</span>
              <p className="text-[11px] text-gray-400/90 leading-normal mt-1">
                Generative fill, smart object removal, artistic overlays, and intelligent prompts.
              </p>
            </div>
            {selectedMode === 'ai' && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            )}
          </button>

          {/* Card B: Pro Lightroom */}
          <button
            type="button"
            onClick={() => setSelectedMode('get' as any || 'lightroom')} // robust mapping
            className={`p-5 rounded-2xl border text-left flex gap-4 transition-all duration-300 relative select-none ${
              selectedMode === 'lightroom'
                ? 'bg-amber-500/[0.04] border-amber-500/80 shadow-[0_4px_24px_rgba(245,158,11,0.15)] scale-[1.01]'
                : 'bg-[#111214]/60 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#131416]/80'
            }`}
          >
            <div className={`p-3 rounded-xl flex items-center justify-center h-12 w-12 shrink-0 ${
              selectedMode === 'lightroom' ? 'bg-amber-500/15 text-amber-500' : 'bg-gray-800/40 text-gray-500'
            }`}>
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-xs font-bold uppercase tracking-widest ${selectedMode === 'lightroom' ? 'text-amber-500' : 'text-gray-400'}`}>
                Lightroom Darkroom
              </span>
              <span className="text-[13px] font-bold text-gray-200">Mathematical Pro Deck</span>
              <p className="text-[11px] text-gray-400/90 leading-normal mt-1">
                HSL color mixer, split toning color grading, curves, texture, grain, and bilateral denoiser.
              </p>
            </div>
            {selectedMode === 'lightroom' && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

        </div>

        {/* Upload Container: Button styled dynamically */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <label 
            htmlFor="image-upload-start" 
            className={`relative inline-flex items-center justify-center px-12 py-5 text-base font-bold font-sans text-white rounded-full cursor-pointer group hover:brightness-105 border-4 border-white/10 transition-all select-none hover:scale-[1.04] active:scale-[0.96] ${
              selectedMode === 'ai'
                ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_8px_30px_rgba(99,102,241,0.4)]'
                : 'bg-amber-500 text-black shadow-[0_8px_30px_rgba(245,158,11,0.4)]'
            }`}
          >
            <UploadCloud className={`w-5.5 h-5.5 mr-3 transition-transform duration-500 ease-in-out group-hover:translate-y-[-2px] group-hover:scale-110 ${
              selectedMode === 'lightroom' ? 'text-black' : ''
            }`} />
            {selectedMode === 'ai' ? 'Enter AI Lab' : 'Open Pro Darkroom'}
          </label>
          <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          <p className="text-xs text-gray-500/95 tracking-wide">or drop your photo inside this window</p>
        </div>

        {/* Feature Cards Grid (Footer highlights based on chosen approach) */}
        <div className="mt-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className={`bg-[#111214]/30 p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group ${
              selectedMode === 'ai' ? 'border-white/[0.04] hover:border-indigo-500/20' : 'border-white/[0.03] hover:border-amber-500/20'
            }`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-4 transition-colors duration-300 ${
                selectedMode === 'ai' 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 text-indigo-400' 
                  : 'bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 text-amber-500'
              }`}>
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">
                {selectedMode === 'ai' ? 'Generative Prompts' : 'Parametric Tone Curves'}
              </h3>
              <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">
                {selectedMode === 'ai' 
                  ? 'Input descriptive text like "make it a warm sunrise" or "give it a neon background" and watch the paint layer apply.'
                  : 'Control specific brightness bands—Highlights, Lights, Darks, and Shadows—with sub-tonal sliders.'}
              </p>
            </div>

            {/* Card 2 */}
            <div className={`bg-[#111214]/30 p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group ${
              selectedMode === 'ai' ? 'border-white/[0.04] hover:border-purple-500/20' : 'border-white/[0.03] hover:border-amber-500/20'
            }`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-4 transition-colors duration-300 ${
                selectedMode === 'ai' 
                  ? 'bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 text-purple-400' 
                  : 'bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 text-amber-500'
              }`}>
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">
                {selectedMode === 'ai' ? 'Creative Overlay' : 'Chromatic HSL Mix'}
              </h3>
              <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">
                {selectedMode === 'ai' 
                  ? 'Apply intelligent design filters modeled by Neural Networks to give a legendary cyberpunk or vintage look instantly.'
                  : 'Separate and shift individual Hues, Saturations, and Luminances for 8 separate color channels with perfect accuracy.'}
              </p>
            </div>

            {/* Card 3 */}
            <div className={`bg-[#111214]/30 p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group ${
              selectedMode === 'ai' ? 'border-white/[0.04] hover:border-pink-500/20' : 'border-white/[0.03] hover:border-amber-500/20'
            }`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl mb-4 transition-colors duration-300 ${
                selectedMode === 'ai' 
                  ? 'bg-pink-500/10 border border-pink-500/20 group-hover:bg-pink-500/20 text-pink-400' 
                  : 'bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 text-amber-500'
              }`}>
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">
                {selectedMode === 'ai' ? 'Brush Highlights' : 'Split Toning Color Grade'}
              </h3>
              <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">
                {selectedMode === 'ai' 
                  ? 'Touch or brush structural zones to target masks, adjust focus fields, or inject glowing neon highlights with precision.'
                  : 'Infuse highlights and shadow ranges with custom color casts dynamically, capturing a movie grading style.'}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
