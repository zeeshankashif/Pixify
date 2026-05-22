/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { UploadCloud, Sparkles, Palette, SlidersHorizontal } from 'lucide-react';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-3xl border ${isDraggingOver ? 'bg-indigo-500/5 border-indigo-500/50 shadow-2xl shadow-indigo-500/5' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs font-bold tracking-widest text-gray-300 uppercase select-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>POWERED BY <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">ZEXAN</span></span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-[#f3f4f6] sm:text-5xl md:text-6xl max-w-3xl leading-tight">
          AI-Powered Photo Editing, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">Redetermined</span>.
        </h1>
        <p className="max-w-2xl text-sm md:text-md text-gray-400/90 leading-relaxed font-normal">
          Retouch photos, paint creative styles, or make professional illumination adjustments with natural language. Say goodbye to complex manuals.
        </p>

        {/* Upload Container */}
        <div className="mt-8 flex flex-col items-center gap-3">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full cursor-pointer group hover:opacity-95 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] select-none hover:scale-[1.02] active:scale-[0.98]">
                <UploadCloud className="w-4.5 h-4.5 mr-2.5 transition-transform duration-500 ease-in-out group-hover:translate-y-[-2px] group-hover:scale-110" />
                Upload Image
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-gray-500/90 tracking-wide">or drag and drop your photo here</p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1 */}
                <div className="bg-[#111214]/40 p-6 rounded-2xl border border-white/[0.04] transition-all duration-300 hover:border-indigo-500/20 hover:bg-[#131416]/60 flex flex-col items-center text-center group">
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 transition-colors duration-300 group-hover:bg-indigo-500/25">
                       <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">Precise Retouching</h3>
                    <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">Touch any area on the image canvas to remove elements, patch backgrounds, or re-color objects with absolute pixel discipline.</p>
                </div>

                {/* Card 2 */}
                <div className="bg-[#111214]/40 p-6 rounded-2xl border border-white/[0.04] transition-all duration-300 hover:border-purple-500/20 hover:bg-[#131416]/60 flex flex-col items-center text-center group">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4 transition-colors duration-300 group-hover:bg-purple-500/25">
                       <Palette className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">Creative Filters</h3>
                    <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">Turn standard snapshots into legendary pieces of digital art. Bring vintage grains, holograms, or custom anime looks to life.</p>
                </div>

                {/* Card 3 */}
                <div className="bg-[#111214]/40 p-6 rounded-2xl border border-white/[0.04] transition-all duration-300 hover:border-pink-500/20 hover:bg-[#131416]/60 flex flex-col items-center text-center group">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-500/10 border border-pink-500/20 rounded-xl mb-4 transition-colors duration-300 group-hover:bg-pink-500/25">
                       <SlidersHorizontal className="w-5 h-5 text-pink-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-100 tracking-wide uppercase">Pro Adjustments</h3>
                    <p className="mt-2 text-xs text-gray-400/80 leading-relaxed">Control ambient shadows, simulate professional photography studio configurations, and paint with temperature curves effortlessly.</p>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;
