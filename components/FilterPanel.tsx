/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Palette } from 'lucide-react';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'Lomo', prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: 'Glitch', prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full bg-[#161719]/40 border border-white/[0.05] rounded-2xl p-4 sm:p-6 flex flex-col gap-3.5 sm:gap-5 animate-fade-in backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 justify-center mb-1">
        <Palette className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold tracking-widest text-[#f3f4f6] uppercase">Apply a Creative Filter</h3>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold select-none transition-all duration-300 border text-center ${
              selectedPresetPrompt === preset.prompt 
              ? 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30 text-[#f3f4f6] shadow-md shadow-indigo-500/5 font-bold' 
              : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.1] active:scale-95'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="relative flex items-center bg-white/[0.01] border border-white/[0.08] focus-within:border-indigo-500/40 rounded-full pl-5 pr-2 py-1.5 transition duration-300">
        <input
          type="text"
          value={customPrompt}
          onChange={handleCustomChange}
          placeholder="Or describe custom filter (e.g., 'warm morning haze, film grain')..."
          className="flex-grow bg-transparent text-gray-100 placeholder-gray-500 text-xs focus:outline-none w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        />
      </div>
      
      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 self-center w-full max-w-xs pt-1">
          <button
            onClick={handleApply}
            className="w-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-2.5 px-6 rounded-full text-xs transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95 shadow-[0_4px_16px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !activePrompt.trim()}
          >
            Apply Selected Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
