/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Sun, Palette, Wand2, RefreshCw, CheckCircle2, Layers } from 'lucide-react';
import { AdjustmentParams, HistogramData } from '../utils/imageProcess';

// Histogram Graph Sub-component
const HistogramGraph: React.FC<{ data: HistogramData | null; editorMode?: 'ai' | 'lightroom' }> = ({ data, editorMode = 'ai' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLightroom = editorMode === 'lightroom';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO HISTOGRAM DATA', canvas.width / 2, canvas.height / 2 + 3);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const maxCount = data.maxCount;

    // Draw grid lines
    ctx.strokeStyle = isLightroom ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const drawChannel = (bins: Uint32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const val = bins[i];
        const barH = maxCount > 0 ? (val / maxCount) * h * 0.9 : 0;
        ctx.lineTo(x, h - barH);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Semi-transparent colored fills overlaying beautifully inside dark frame
    ctx.globalCompositeOperation = 'screen';
    drawChannel(data.r, 'rgba(239, 68, 68, 0.22)');   // Red
    drawChannel(data.g, 'rgba(16, 185, 129, 0.22)'); // Green
    drawChannel(data.b, 'rgba(59, 130, 246, 0.22)');  // Blue
    drawChannel(data.lum, 'rgba(255, 255, 255, 0.15)'); // Luminosity

    // Outline for Luminosity track
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = isLightroom ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w;
      const barH = maxCount > 0 ? (data.lum[i] / maxCount) * h * 0.9 : 0;
      ctx.lineTo(x, h - barH);
    }
    ctx.stroke();

  }, [data, isLightroom]);

  return (
    <div className={`relative w-full h-24 overflow-hidden select-none mb-4 border ${
      isLightroom 
        ? 'bg-[#101012] border-[#2d2d30] rounded-lg' 
        : 'bg-[#090a0b]/80 border-white/[0.05] rounded-2xl'
    }`}>
      <canvas ref={canvasRef} width={256} height={96} className="w-full h-full" />
      <div className={`absolute top-2 left-2.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase font-mono border ${
        isLightroom 
          ? 'text-amber-500 bg-[#16161a] border-[#3a3a3d]' 
          : 'text-[#00f0ff]/80 bg-[#0c0d0e]/80 border-white/[0.04]'
      }`}>
        Live Histogram
      </div>
      <div className="absolute bottom-1 right-2.5 text-[8px] font-semibold text-gray-500 font-mono tracking-wider uppercase">
        Highlights
      </div>
      <div className="absolute bottom-1 left-2.5 text-[8px] font-semibold text-gray-500 font-mono tracking-wider uppercase">
        Shadows
      </div>
    </div>
  );
};

interface AdjustmentPanelProps {
  params: AdjustmentParams;
  onChange: (newParams: AdjustmentParams) => void;
  onApply: () => void;
  onReset: () => void;
  histogramData: HistogramData | null;
  isLoading: boolean;
  editorMode?: 'ai' | 'lightroom';
}

type PanelTab = 'light' | 'color' | 'hsl' | 'grading' | 'effects';
type HslMode = 'hue' | 'sat' | 'lum';

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  params,
  onChange,
  onApply,
  onReset,
  histogramData,
  isLoading,
  editorMode = 'ai'
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('light');
  const [activeHslMode, setActiveHslMode] = useState<HslMode>('sat');

  const isLightroom = editorMode === 'lightroom';

  const updateParam = (key: keyof AdjustmentParams, value: number) => {
    onChange({
      ...params,
      [key]: value
    });
  };

  const updateHslParam = (mode: HslMode, colorKey: string, value: number) => {
    onChange({
      ...params,
      [mode]: {
        ...params[mode],
        [colorKey]: value
      }
    });
  };

  const resetAll = () => {
    onReset();
  };

  // Human names and badge styles for HSL color tracks
  const colorsConfig = [
    { key: 'red', name: 'Red', color: '#ef4444' },
    { key: 'orange', name: 'Orange', color: '#f97316' },
    { key: 'yellow', name: 'Yellow', color: '#eab308' },
    { key: 'green', name: 'Green', color: '#22c55e' },
    { key: 'cyan', name: 'Cyan', color: '#06b6d4' },
    { key: 'blue', name: 'Blue', color: '#3b82f6' },
    { key: 'purple', name: 'Purple', color: '#a855f7' },
    { key: 'magenta', name: 'Magenta', color: '#ec4899' }
  ];

  // Helper styles based on active editorMode theme
  const panelBg = isLightroom 
    ? 'bg-[#18181b] border-[#2d2d30] text-[#e4e4e7] rounded-xl shadow-lg shadow-black/80' 
    : 'bg-[#161719]/40 border-white/[0.05] rounded-3xl backdrop-blur-md shadow-2xl';

  const textAccent = isLightroom ? 'text-amber-500' : 'text-indigo-400';
  const rangeAccent = isLightroom ? 'accent-amber-500' : 'accent-indigo-400';
  const headerUnderline = isLightroom ? 'border-amber-500 text-amber-500' : 'border-indigo-400 text-white';

  return (
    <div className={`w-full p-3.5 sm:p-5 flex flex-col gap-3.5 sm:gap-5 border animate-fade-in ${panelBg}`}>
      
      {/* Visual Diagnostic Tools */}
      <div className="hidden sm:block">
        <HistogramGraph data={histogramData} editorMode={editorMode} />
      </div>

      {/* Primary Category Selector */}
      <div className={`flex p-0.5 mb-1 gap-1 overflow-x-auto scroller-none border-b ${
        isLightroom ? 'border-[#2d2d30]' : 'border-white/[0.05]'
      }`}>
        {([
          { id: 'light', label: 'Light & Curve', icon: Sun },
          { id: 'color', label: 'Color Mixer', icon: Palette },
          { id: 'hsl', label: 'HSL Color Mixer', icon: Wand2 },
          { id: 'grading', label: 'Split Toning', icon: Layers },
          { id: 'effects', label: 'Detail & Effects', icon: SlidersHorizontal }
        ] as const).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 border-b-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider select-none transition-all duration-200 shrink-0 ${
                isActive
                  ? headerUnderline
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Tab Panel Sliders */}
      <div className="flex flex-col gap-3 sm:gap-4 max-h-[220px] sm:max-h-[360px] overflow-y-auto pr-1">
        
        {/* TAB 1: LIGHT */}
        {activeTab === 'light' && (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.5">
              Exposure, Tone & Contrast
            </div>
            {/* Exposure */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Exposure</span>
                <button 
                  onClick={() => updateParam('exposure', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.exposure > 0 ? `+${params.exposure}` : params.exposure}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.exposure} 
                onChange={(e) => updateParam('exposure', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Contrast</span>
                <button 
                  onClick={() => updateParam('contrast', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.contrast > 0 ? `+${params.contrast}` : params.contrast}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.contrast} 
                onChange={(e) => updateParam('contrast', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Highlights */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Highlights</span>
                <button 
                  onClick={() => updateParam('highlights', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.highlights > 0 ? `+${params.highlights}` : params.highlights}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.highlights} 
                onChange={(e) => updateParam('highlights', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Shadows */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Shadows</span>
                <button 
                  onClick={() => updateParam('shadows', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.shadows > 0 ? `+${params.shadows}` : params.shadows}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.shadows} 
                onChange={(e) => updateParam('shadows', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Whites */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Whites</span>
                <button 
                  onClick={() => updateParam('whites', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.whites > 0 ? `+${params.whites}` : params.whites}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.whites} 
                onChange={(e) => updateParam('whites', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Blacks */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Blacks</span>
                <button 
                  onClick={() => updateParam('blacks', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.blacks > 0 ? `+${params.blacks}` : params.blacks}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.blacks} 
                onChange={(e) => updateParam('blacks', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* PARAMETRIC TONE CURVES (Lightroom Exclusive details) */}
            <div className="text-[10px] font-bold text-amber-500/90 uppercase tracking-widest border-b border-white/[0.03] pt-3 pb-1 flex justify-between items-center">
              <span>Parametric Tone Curve</span>
              <span className="text-[8px] tracking-normal font-mono text-gray-500 lowercase">Lightroom Engine core</span>
            </div>

            {/* Highlights Curve */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Curve: Highlights</span>
                <button 
                  onClick={() => updateParam('curveHighlights', 0)}
                  className={`text-[11px] font-mono font-semibold ${textAccent}`}
                >
                  {params.curveHighlights}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.curveHighlights} 
                onChange={(e) => updateParam('curveHighlights', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Lights Curve */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Curve: Lights</span>
                <button 
                  onClick={() => updateParam('curveLights', 0)}
                  className={`text-[11px] font-mono font-semibold ${textAccent}`}
                >
                  {params.curveLights}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.curveLights} 
                onChange={(e) => updateParam('curveLights', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Darks Curve */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Curve: Darks</span>
                <button 
                  onClick={() => updateParam('curveDarks', 0)}
                  className={`text-[11px] font-mono font-semibold ${textAccent}`}
                >
                  {params.curveDarks}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.curveDarks} 
                onChange={(e) => updateParam('curveDarks', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Shadows Curve */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Curve: Shadows</span>
                <button 
                  onClick={() => updateParam('curveShadows', 0)}
                  className={`text-[11px] font-mono font-semibold ${textAccent}`}
                >
                  {params.curveShadows}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.curveShadows} 
                onChange={(e) => updateParam('curveShadows', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

          </div>
        )}

        {/* TAB 2: COLOR */}
        {activeTab === 'color' && (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.55">
              White Balance & Vibrancy
            </div>
            {/* Temperature */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Temperature</span>
                <button 
                  onClick={() => updateParam('temperature', 0)}
                  className="text-[11px] font-mono font-bold text-orange-400 hover:text-orange-300"
                >
                  {params.temperature > 0 ? `Warm +${params.temperature}` : params.temperature < 0 ? `Cool ${params.temperature}` : '0 (As Shot)'}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.temperature} 
                onChange={(e) => updateParam('temperature', Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-500 via-gray-700 to-amber-500 accent-white"
              />
            </div>

            {/* Tint */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Tint</span>
                <button 
                  onClick={() => updateParam('tint', 0)}
                  className="text-[11px] font-mono font-bold text-pink-400 hover:text-pink-300"
                >
                  {params.tint > 0 ? `Magenta +${params.tint}` : params.tint < 0 ? `Green ${params.tint}` : '0'}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.tint} 
                onChange={(e) => updateParam('tint', Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-emerald-500 via-gray-700 to-fuchsia-500 accent-white"
              />
            </div>

            {/* Vibrance */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Vibrance</span>
                <button 
                  onClick={() => updateParam('vibrance', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.vibrance > 0 ? `+${params.vibrance}` : params.vibrance}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.vibrance} 
                onChange={(e) => updateParam('vibrance', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Saturation</span>
                <button 
                  onClick={() => updateParam('saturation', 0)}
                  className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                >
                  {params.saturation > 0 ? `+${params.saturation}` : params.saturation}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.saturation} 
                onChange={(e) => updateParam('saturation', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>
          </div>
        )}

        {/* TAB 3: HSL COLOR CHANNELS */}
        {activeTab === 'hsl' && (
          <div className="flex flex-col gap-3 animate-fade-in text-left">
            {/* Sub-selector for Mode */}
            <div className={`flex justify-center rounded-full p-1 self-center w-full max-w-sm mb-2 gap-1.5 border ${
              isLightroom ? 'bg-[#101012] border-[#2d2d30]' : 'bg-black/30 border-white/[0.04]'
            }`}>
              {([
                { id: 'hue', label: 'Hue' },
                { id: 'sat', label: 'Saturation' },
                { id: 'lum', label: 'Luminance' }
              ] as const).map(hslMode => {
                const isSelected = activeHslMode === hslMode.id;
                return (
                  <button
                    key={hslMode.id}
                    onClick={() => setActiveHslMode(hslMode.id)}
                    className={`flex-grow py-1 px-3 text-[10px] font-bold uppercase tracking-wider rounded-full select-none transition-all duration-200 ${
                      isSelected
                        ? isLightroom 
                          ? 'bg-[#1e1e21] border border-[#3e3e42] text-amber-500 font-black'
                          : 'bg-[#18191b] border border-white/[0.05] text-[#00f0ff]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {hslMode.label}
                  </button>
                );
              })}
            </div>

            {/* Render 8 color tracks based on nested tab selection */}
            {colorsConfig.map(channel => (
              <div key={channel.key} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-300">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/[0.1] shadow-inner" 
                      style={{ backgroundColor: channel.color }} 
                    />
                    <span>{channel.name}</span>
                  </div>
                  <button
                    onClick={() => updateHslParam(activeHslMode, channel.key, 0)}
                    className={`text-[11px] font-mono font-bold hover:brightness-110 ${textAccent}`}
                    title="Reset single track"
                  >
                    {params[activeHslMode][channel.key] > 0 ? `+${params[activeHslMode][channel.key]}` : params[activeHslMode][channel.key]}
                  </button>
                </div>
                {/* Specific colored range inputs */}
                <input
                  type="range" min="-100" max="100"
                  value={params[activeHslMode][channel.key]}
                  onChange={(e) => updateHslParam(activeHslMode, channel.key, Number(e.target.value))}
                  style={{
                    accentColor: channel.color
                  }}
                  className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: SPLIT TONING (COLOR GRADING) */}
        {activeTab === 'grading' && (
          <div className="flex flex-col gap-5 animate-fade-in text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.5">
              Highlight & Shadow Tint Filters
            </div>

            {/* HIGHLIGHT GRADING BLOCK */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isLightroom ? 'bg-[#141416] border-[#2c2c2f]' : 'bg-white/[0.01] border-white/[0.03]'
            }`}>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                Highlights Grading
              </div>

              {/* Highlights Hue */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Hue Hue</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{params.splitToningHighlightsHue}°</span>
                </div>
                <input 
                  type="range" min="0" max="360" 
                  value={params.splitToningHighlightsHue} 
                  onChange={(e) => updateParam('splitToningHighlightsHue', Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 accent-white"
                />
              </div>

              {/* Highlights Saturation */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Saturation</span>
                  <button 
                    onClick={() => updateParam('splitToningHighlightsSat', 0)}
                    className={`text-[11px] font-mono font-bold ${textAccent}`}
                  >
                    {params.splitToningHighlightsSat}%
                  </button>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={params.splitToningHighlightsSat} 
                  onChange={(e) => updateParam('splitToningHighlightsSat', Number(e.target.value))}
                  className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
                />
              </div>
            </div>

            {/* SHADOW GRADING BLOCK */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              isLightroom ? 'bg-[#141416] border-[#2c2c2f]' : 'bg-white/[0.01] border-white/[0.03]'
            }`}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Shadows Grading
              </div>

              {/* Shadows Hue */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Hue Hue</span>
                  <span className="text-xs font-mono font-bold text-gray-200">{params.splitToningShadowsHue}°</span>
                </div>
                <input 
                  type="range" min="0" max="360" 
                  value={params.splitToningShadowsHue} 
                  onChange={(e) => updateParam('splitToningShadowsHue', Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 accent-white"
                />
              </div>

              {/* Shadows Saturation */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Saturation</span>
                  <button 
                    onClick={() => updateParam('splitToningShadowsSat', 0)}
                    className={`text-[11px] font-mono font-bold ${textAccent}`}
                  >
                    {params.splitToningShadowsSat}%
                  </button>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={params.splitToningShadowsSat} 
                  onChange={(e) => updateParam('splitToningShadowsSat', Number(e.target.value))}
                  className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: EFFECTS & DETAIL */}
        {activeTab === 'effects' && (
          <div className="flex flex-col gap-4 animate-fade-in text-left">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/[0.03] pb-1.5">
              Lightroom Textures & Analog Details
            </div>
            
            {/* Texture */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Texture</span>
                <button 
                  onClick={() => updateParam('texture', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.texture > 0 ? `+${params.texture}` : params.texture}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.texture} 
                onChange={(e) => updateParam('texture', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Clarity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Clarity</span>
                <button 
                  onClick={() => updateParam('clarity', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.clarity > 0 ? `+${params.clarity}` : params.clarity}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.clarity} 
                onChange={(e) => updateParam('clarity', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Dehaze */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Dehaze</span>
                <button 
                  onClick={() => updateParam('dehaze', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.dehaze > 0 ? `+${params.dehaze}` : params.dehaze}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.dehaze} 
                onChange={(e) => updateParam('dehaze', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Vignette */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Vignette</span>
                <button 
                  onClick={() => updateParam('vignette', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.vignette > 0 ? `Light +${params.vignette}` : params.vignette < 0 ? `Dark ${params.vignette}` : '0'}
                </button>
              </div>
              <input 
                type="range" min="-100" max="100" 
                value={params.vignette} 
                onChange={(e) => updateParam('vignette', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-white/[0.03] pt-2 pb-1">
              Sharpen & Noise Corrections
            </div>

            {/* Sharpen */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Sharpening</span>
                <button 
                  onClick={() => updateParam('sharpen', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.sharpen}
                </button>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={params.sharpen} 
                onChange={(e) => updateParam('sharpen', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Film Grain (The classic Lightroom vintage grain) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Film Grain (Noise)</span>
                <button 
                  onClick={() => updateParam('grain', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.grain}
                </button>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={params.grain} 
                onChange={(e) => updateParam('grain', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

            {/* Noise Reduction (Denoise) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-semibold tracking-wide">Luminance Noise Reduction</span>
                <button 
                  onClick={() => updateParam('noiseReduction', 0)}
                  className={`text-[11px] font-mono font-bold ${textAccent}`}
                >
                  {params.noiseReduction}
                </button>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={params.noiseReduction} 
                onChange={(e) => updateParam('noiseReduction', Number(e.target.value))}
                className={`w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer ${rangeAccent}`}
              />
            </div>

          </div>
        )}

      </div>

      {/* Confirmation & Reset Action Buttons */}
      <div className={`flex gap-3 justify-center border-t pt-4 ${
        isLightroom ? 'border-[#2d2d30]' : 'border-white/[0.04]'
      }`}>
        <button
          onClick={resetAll}
          disabled={isLoading}
          className={`flex-1 select-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full border transition-all duration-300 disabled:opacity-40 text-xs text-gray-300 font-bold active:scale-95 ${
            isLightroom 
              ? 'border-[#3a3a3d] bg-[#1e1ea4]/0 hover:bg-[#2d2d30]' 
              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Sliders
        </button>
        <button
          onClick={onApply}
          disabled={isLoading}
          className={`flex-1 select-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            isLightroom
              ? 'bg-amber-500 hover:bg-amber-600 text-black font-black shadow-[0_4px_16px_rgba(245,158,11,0.25)]'
              : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-[0_4px_16px_rgba(99,102,241,0.2)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Apply Tuning
        </button>
      </div>

    </div>
  );
};

export default AdjustmentPanel;
