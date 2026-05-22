/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Crop } from 'lucide-react';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'free' | '1:1' | '16:9';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('free');
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  };

  const aspects: { name: AspectRatio, value: number | undefined }[] = [
    { name: 'free', value: undefined },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
  ];

  return (
    <div className="w-full bg-[#161719]/40 border border-white/[0.05] rounded-2xl p-6 flex flex-col items-center gap-5 animate-fade-in backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 justify-center">
        <Crop className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold tracking-widest text-[#f3f4f6] uppercase">Crop Image canvas</h3>
      </div>
      <p className="text-xs text-gray-400/80 -mt-3 text-center">Touch and drag bounding boxes on the preview area to select your focus.</p>
      
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-mono">Aspect:</span>
        <div className="flex items-center gap-1.5">
          {aspects.map(({ name, value }) => (
            <button
              key={name}
              onClick={() => handleAspectChange(name, value)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 uppercase ${
                activeAspect === name 
                ? 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 text-[#f3f4f6] shadow-sm' 
                : 'bg-white/[0.02] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full max-w-xs mt-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-2.5 px-6 rounded-full text-xs transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95 shadow-[0_4px_16px_rgba(99,102,241,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm crop region
      </button>
    </div>
  );
};

export default CropPanel;
