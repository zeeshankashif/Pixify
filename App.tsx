/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import { Sparkles, Crop as CropIcon, SlidersHorizontal, Palette, Undo2, Redo2, Eye, RotateCcw, Upload, Download } from 'lucide-react';
import StartScreen from './components/StartScreen';
import {
  applyLightroomFilters,
  computeHistogram,
  defaultAdjustments,
  type AdjustmentParams,
  type HistogramData
} from './utils/imageProcess';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

const App: React.FC = () => {
  const [editorMode, setEditorMode] = useState<'ai' | 'lightroom'>('ai');
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // States and refs for client-side Lightroom offline adjustments
  const [adjustParams, setAdjustParams] = useState<AdjustmentParams>(defaultAdjustments);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const adjustImgRef = useRef<HTMLImageElement | null>(null);
  const adjustCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAdjustParams(defaultAdjustments);
  }, []);

  // Performance-optimized preview drawing on HTML canvas
  const triggerAdjustmentRender = useCallback(() => {
    const img = adjustImgRef.current;
    const canvas = adjustCanvasRef.current;
    if (!img || !canvas) {
      setHistogramData(null);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Process adjustments on a downscaled preview canvas for buttery 60fps interaction
    const maxPreviewDim = 800;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxPreviewDim || h > maxPreviewDim) {
      if (w > h) {
        h = Math.round((h * maxPreviewDim) / w);
        w = maxPreviewDim;
      } else {
        w = Math.round((w * maxPreviewDim) / h);
        h = maxPreviewDim;
      }
    }

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, 0, 0, w, h);

    const srcData = ctx.getImageData(0, 0, w, h);
    const destData = ctx.createImageData(w, h);

    // Apply Lightroom and HSL color-mixing on pixels locally
    applyLightroomFilters(srcData, destData, adjustParams);
    ctx.putImageData(destData, 0, 0);

    // Parse diagnostic histogram
    const hist = computeHistogram(destData);
    setHistogramData(hist);
  }, [adjustParams]);

  // Preload native Image elements on currentImageUrl update
  useEffect(() => {
    if (!currentImageUrl) {
      adjustImgRef.current = null;
      setHistogramData(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      adjustImgRef.current = img;
      triggerAdjustmentRender();
    };
    img.src = currentImageUrl;
  }, [currentImageUrl, triggerAdjustmentRender]);

  // Handle active sliders updating state
  useEffect(() => {
    triggerAdjustmentRender();
  }, [adjustParams, triggerAdjustmentRender]);

  // Handle saving local physical adjustments onto full-size image history
  const handleApplyLocalAdjustment = useCallback(async () => {
    const img = adjustImgRef.current;
    if (!img || !currentImage) {
      setError('No active image to apply adjustments on.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Yield so React can draw our new high-tech looping filament vortex loader
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Failed to configure 2D workspace.");

      ctx.drawImage(img, 0, 0, w, h);
      const srcData = ctx.getImageData(0, 0, w, h);
      const destData = ctx.createImageData(w, h);

      // Apply on high-resolution image
      applyLightroomFilters(srcData, destData, adjustParams);
      ctx.putImageData(destData, 0, 0);

      const mimeType = currentImage.type || 'image/png';
      const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const adjustedUrl = canvas.toDataURL(mimeType, 0.95);
      const adjustedFile = dataURLtoFile(adjustedUrl, `lightroom-${Date.now()}.${ext}`);

      addImageToHistory(adjustedFile);
      setAdjustParams(defaultAdjustments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown filter execution.';
      setError(`Failed to save adjustments: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, adjustParams, addImageToHistory]);

  const handleResetSliders = useCallback(() => {
    setAdjustParams(defaultAdjustments);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      setEditHotspot(null);
      setDisplayHotspot(null);
  }, []);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null, mode: 'ai' | 'lightroom') => {
    if (files && files[0]) {
      setEditorMode(mode);
      handleImageUpload(files[0]);
      if (mode === 'lightroom') {
        setActiveTab('adjust');
      } else {
        setActiveTab('retouch');
      }
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;
    
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
};

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    const imageDisplay = (
      <div className="relative w-full flex items-center justify-center">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className={`w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none ${activeTab === 'adjust' ? 'hidden' : ''}`}
            />
        )}
        {/* The adjustment preview canvas */}
        <canvas
            ref={adjustCanvasRef}
            className={`w-full h-auto object-contain max-h-[60vh] rounded-xl bg-black/10 select-none ${activeTab === 'adjust' && !isComparing ? 'block' : 'hidden'}`}
        />
        {/* The current image is an overlay that fades in/out for comparison */}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${
              activeTab === 'adjust' 
                ? (isComparing ? 'block opacity-100' : 'hidden opacity-0') 
                : (isComparing ? 'opacity-0' : 'opacity-100')
            } ${activeTab === 'retouch' ? 'cursor-crosshair' : ''} ${activeTab === 'adjust' ? 'pointer-events-none' : ''}`}
        />
      </div>
    );
    
    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img 
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl} 
        alt="Crop this image"
        className="w-full h-auto object-contain max-h-[60vh] rounded-xl"
      />
    );

    const tabsToShow = editorMode === 'lightroom' 
      ? [
          { id: 'adjust' as Tab, label: 'Tuning Deck', icon: SlidersHorizontal },
          { id: 'crop' as Tab, label: 'Crop & Rotate', icon: CropIcon }
        ]
      : [
          { id: 'retouch' as Tab, label: 'AI Retouch', icon: Sparkles },
          { id: 'crop' as Tab, label: 'Crop', icon: CropIcon },
          { id: 'adjust' as Tab, label: 'Manual Adjust', icon: SlidersHorizontal },
          { id: 'filters' as Tab, label: 'AI Filters', icon: Palette }
        ];

    const isSlidersModified = JSON.stringify(adjustParams) !== JSON.stringify(defaultAdjustments);

    const workspaceHeader = (
      <div className={`w-full flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 py-3 md:py-3.5 border-b transition-all duration-300 rounded-t-2xl ${
        editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/90 border-[#2d2d30]/30'
      }`}>
        {/* Left corner: Cancel action + Undo/Redo/Compare Group */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={handleUploadNew}
            className={`px-3 py-1.5 md:px-3.5 md:py-1.5 text-xs font-bold transition-all duration-200 uppercase tracking-wider border rounded-lg flex items-center gap-1.5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 select-none ${
              editorMode === 'lightroom'
                ? 'border-[#2d2d30] text-gray-300'
                : 'border-white/[0.08] bg-[#1a1b1e]/40 hover:bg-white/[0.06] text-gray-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden min-[360px]:inline">Cancel</span>
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-2 transition-all duration-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                editorMode === 'lightroom' ? 'hover:bg-[#2d2d30] text-gray-300' : 'hover:bg-white/[0.05] text-gray-200'
              }`}
              title="Undo Action"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-2 transition-all duration-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                editorMode === 'lightroom' ? 'hover:bg-[#2d2d30] text-gray-300' : 'hover:bg-white/[0.05] text-gray-200'
              }`}
              title="Redo Action"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            
            {canUndo && (
              <button
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                className={`px-2 py-1.5 md:px-2.5 md:py-1.5 transition-all duration-200 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold border ${
                  editorMode === 'lightroom' 
                    ? 'border-[#2d2d30] hover:bg-[#2d2d30] text-gray-300' 
                    : 'border-white/[0.04] hover:bg-white/[0.05] text-gray-200'
                }`}
                title="Hold to see original"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden min-[360px]:inline">Compare</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Image Name and Info display */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-mono tracking-wide px-3.5 py-1.5 bg-black/25 border border-white/[0.03] rounded-full max-w-xs truncate">
          <span className="truncate">{currentImage ? currentImage.name : 'Untitled_Project.png'}</span>
          <span className="text-gray-700 select-none">|</span>
          <span className="font-sans font-black text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">STUDIO</span>
        </div>

        {/* Right corner: Engine Mode + Download Image */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Active Mode Switcher */}
          <button
            type="button"
            onClick={() => {
              const nextMode = editorMode === 'ai' ? 'lightroom' : 'ai';
              setEditorMode(nextMode);
              setActiveTab(nextMode === 'lightroom' ? 'adjust' : 'retouch');
            }}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg border transition-all duration-300 flex items-center gap-1 ${
              editorMode === 'lightroom'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20'
                : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'
            }`}
          >
            <span>{editorMode === 'lightroom' ? '✦ Pro Lightroom' : '✦ AI Lab'}</span>
            <span className="text-[8px] opacity-65 font-normal">(Switch)</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`px-4 py-2 font-bold transition-all duration-200 ease-in-out active:scale-95 text-xs flex items-center justify-center gap-1.5 rounded-lg text-center ${
              editorMode === 'lightroom'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-[0_4px_16px_rgba(245,158,11,0.25)]'
                : 'bg-[#6366f1] hover:bg-[#5355eb] text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    );

    return (
      <div className={`w-full max-w-[1550px] mx-auto flex flex-col gap-5 animate-fade-in relative`}>
        {/* Workspace Top Bar action deck */}
        {workspaceHeader}

        {/* Three Columns Workspace layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[290px_1fr_310px] gap-5 items-stretch">
          
          {/* COLUMN 1: LEFT SIDEBAR (Controls & Presets Selection) */}
          <div className="hidden lg:flex flex-col gap-4 w-full">
            {/* Engine Select Status Indicator */}
            <div className={`p-4 border rounded-xl flex flex-col gap-2 ${
              editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Engine Output:</span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  editorMode === 'lightroom' ? 'text-amber-500' : 'text-indigo-400'
                }`}>
                  ● {editorMode === 'lightroom' ? 'PRO LIGHTROOM' : 'AI LAB ACTIVE'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-normal">
                {editorMode === 'lightroom' 
                  ? 'Manual high-precision granular photo tuning filters applied locally.'
                  : 'Generative AI-powered inpainting mask edits and creative overlays.'}
              </p>
            </div>

            {/* Select Area Area Panel */}
            <div className={`p-4 border rounded-xl flex flex-col gap-3 ${
              editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
            }`}>
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold">Select Area</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('retouch')}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 border capitalize select-none ${
                    activeTab === 'retouch'
                      ? editorMode === 'lightroom'
                        ? 'bg-[#1e1e21] border-[#3c3c3f] text-amber-500'
                        : 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 text-[#f3f4f6]'
                      : 'bg-white/[0.01] border-white/[0.06] text-gray-455 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('filters')}
                  disabled={editorMode === 'lightroom'}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 border capitalize select-none ${
                    activeTab === 'filters'
                      ? 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 text-[#f3f4f6]'
                      : 'bg-white/[0.01]/10 border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Whole Photo</span>
                </button>
              </div>
            </div>

            {/* Workflows Navigation Selection Grid */}
            <div className={`p-4 border rounded-xl flex flex-col gap-3 ${
              editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
            }`}>
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold">Workspace Tools</span>
              <div className="grid grid-cols-2 gap-2">
                {editorMode === 'ai' && (
                  <button
                    onClick={() => setActiveTab('retouch')}
                    className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1.5 select-none ${
                      activeTab === 'retouch'
                        ? 'bg-[#18191b] border-indigo-500/30 text-[#f3f4f6]'
                        : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px]">AI Retouch</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('crop')}
                  className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1.5 select-none ${
                    activeTab === 'crop'
                      ? editorMode === 'lightroom'
                        ? 'bg-[#1e1e21] border-amber-500/40 text-amber-500'
                        : 'bg-[#18191b] border-indigo-500/30 text-[#f3f4f6]'
                      : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <CropIcon className={`w-4 h-4 ${editorMode === 'lightroom' ? 'text-amber-500' : 'text-pink-400'}`} />
                  <span className="text-[11px]">Crop Region</span>
                </button>
                {editorMode === 'ai' && (
                  <button
                    onClick={() => setActiveTab('filters')}
                    className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1.5 select-none ${
                      activeTab === 'filters'
                        ? 'bg-[#18191b] border-indigo-500/30 text-[#f3f4f6]'
                        : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px]">AI Filters</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('adjust')}
                  className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1.5 select-none ${
                    activeTab === 'adjust'
                      ? editorMode === 'lightroom'
                        ? 'bg-[#1e1e21] border-amber-500/40 text-amber-500'
                        : 'bg-[#18191b] border-indigo-500/30 text-[#f3f4f6]'
                      : 'bg-white/[0.01] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <SlidersHorizontal className={`w-4 h-4 ${editorMode === 'lightroom' ? 'text-amber-500' : 'text-purple-400'}`} />
                  <span className="text-[11px]">Manual Adjust</span>
                </button>
              </div>
            </div>

            {/* activeTab Specific Option Panels inside Left Sidebar */}
            <div className="w-full">
              {activeTab === 'retouch' && (
                <div className={`p-4 border rounded-xl flex flex-col gap-3 animate-fade-in ${
                  editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
                }`}>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">AI Retouch Parameter</span>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    {editHotspot ? '✓ Touch pointer locked. Enter prompt below:' : 'Touch any area on the center photo to place the modification focus point.'}
                  </p>
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} 
                    className="w-full flex flex-col gap-2 mt-1"
                  >
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={editHotspot ? "e.g., 'change shirt to blue'" : "Select target area first..."}
                      className="w-full bg-black/35 border border-white/[0.08] focus:border-indigo-500/70 font-mono text-xs p-2.5 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none"
                      disabled={isLoading || !editHotspot}
                    />
                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-2 px-4 text-xs rounded-lg transition-all duration-300 hover:opacity-90 active:scale-95 shadow-md disabled:from-white/[0.04] disabled:to-white/[0.04] disabled:text-gray-600 disabled:cursor-not-allowed"
                      disabled={isLoading || !prompt.trim() || !editHotspot}
                    >
                      Process Generative AI
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'crop' && (
                <CropPanel 
                  onApplyCrop={handleApplyCrop} 
                  onSetAspect={setAspect} 
                  isLoading={isLoading} 
                  isCropping={!!completedCrop?.width && completedCrop.width > 0} 
                />
              )}
              {activeTab === 'filters' && (
                <FilterPanel 
                  onApplyFilter={handleApplyFilter} 
                  isLoading={isLoading} 
                />
              )}
              {activeTab === 'adjust' && (
                <div className={`p-4 border rounded-xl flex flex-col gap-3 animate-fade-in ${
                  editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
                }`}>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#f59e0b] font-black">Manual Tuning Deck</span>
                  <p className="text-[11px] text-gray-400 pb-1 leading-relaxed">
                    Color, curves, and light parameters are actively mapped in the right-hand stack. Tweak sliders dynamically.
                  </p>
                  <div className="flex flex-col gap-1 text-[10px] font-mono text-gray-500">
                    <div className="flex justify-between border-b border-white/[0.03] py-1">
                      <span>Telemetry Feed:</span>
                      <span className="text-emerald-500 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.03] py-1">
                      <span>Lightroom Engine:</span>
                      <span className="text-amber-500">GPU Native</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: CENTER WORKSPACE (Canvas) */}
          <div className="flex-1 flex flex-col items-center justify-between gap-4 md:gap-5 bg-[#0a0b0d]/50 border border-white/[0.03] rounded-2xl p-3 md:p-4 min-h-[350px] md:min-h-[500px]">
            <div className={`relative w-full flex items-center justify-center p-2 bg-black/10 border rounded-xl overflow-hidden self-stretch flex-grow min-h-[260px] md:min-h-[440px] max-h-[45vh] md:max-h-[65vh] ${
              editorMode === 'lightroom' ? 'border-[#2d2d30]/70' : 'border-white/[0.04]'
            }`}>
              {isLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-30 flex flex-col items-center justify-center overflow-hidden animate-fade-in">
                      <Spinner />
                  </div>
              )}
              
              {activeTab === 'crop' ? (
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)} 
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[40vh] md:max-h-[60vh] flex items-center justify-center select-none"
                >
                  {cropImageElement}
                </ReactCrop>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Base image is the original */}
                  {originalImageUrl && (
                      <img
                          key={originalImageUrl}
                          src={originalImageUrl}
                          alt="Original"
                          className={`w-full h-auto object-contain max-h-[40vh] md:max-h-[58vh] rounded-xl pointer-events-none ${isComparing ? 'block opacity-100' : 'hidden opacity-0'}`}
                      />
                  )}
                  {/* The adjustment preview canvas */}
                  <canvas
                      ref={adjustCanvasRef}
                      className={`w-full h-auto object-contain max-h-[40vh] md:max-h-[58vh] rounded-xl bg-black/10 select-none ${isSlidersModified && !isComparing ? 'block' : 'hidden'}`}
                  />
                  {/* The current image */}
                  <img
                      ref={imgRef}
                      key={currentImageUrl}
                      src={currentImageUrl}
                      alt="Current"
                      className={`w-full h-auto object-contain max-h-[40vh] md:max-h-[58vh] rounded-xl transition-opacity duration-200 ease-in-out ${
                        isSlidersModified 
                          ? 'hidden opacity-0' 
                          : (isComparing ? 'hidden opacity-0' : 'block opacity-100')
                      } pointer-events-none`}
                  />
                  
                  {/* Click Capturer Transparent Overlay for focal points placement (Only active in retouch tab) */}
                  {activeTab === 'retouch' && (
                    <div
                      onClick={(e) => {
                        const target = e.currentTarget;
                        const rect = target.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left;
                        const offsetY = e.clientY - rect.top;
                        setDisplayHotspot({ x: offsetX, y: offsetY });
                        
                        const realImg = imgRef.current;
                        if (realImg) {
                          const { naturalWidth, naturalHeight } = realImg;
                          const { clientWidth, clientHeight } = target;
                          const scaleX = naturalWidth / clientWidth;
                          const scaleY = naturalHeight / clientHeight;
                          setEditHotspot({
                            x: Math.round(offsetX * scaleX),
                            y: Math.round(offsetY * scaleY)
                          });
                        }
                      }}
                      className="absolute inset-x-0 inset-y-0 cursor-crosshair z-10 bg-transparent rounded-xl"
                    />
                  )}
                </div>
              )}

              {/* Touch targeted hotspot identifier */}
              {displayHotspot && !isLoading && activeTab === 'retouch' && (
                  <div 
                      className="absolute rounded-full w-6 h-6 bg-[#6366f1]/60 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                  >
                      <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-[#818cf8]"></div>
                  </div>
              )}
            </div>
            
            {/* Center Zoom bar mimicking the reference photo's scale visual slider */}
            <div className="hidden sm:flex items-center gap-3 w-full max-w-xs px-4 py-1.5 bg-black/20 border border-white/[0.02] rounded-full text-[10px] font-mono uppercase tracking-wide text-gray-500 select-none">
              <span className="shrink-0 text-gray-600 font-bold">Zoom Canvas:</span>
              <input
                type="range"
                min="20"
                max="150"
                defaultValue="100"
                className="w-full h-1 bg-[#27272a] rounded cursor-not-allowed opacity-30 accent-indigo-400"
                disabled
              />
              <span className="shrink-0 text-gray-300">100% Fit</span>
            </div>

            {/* Mobile-Only Dashboard Toolbar & Active Panel (Visible on screens smaller than lg) */}
            <div className="w-full lg:hidden flex flex-col gap-3 mt-1.5 pt-3.5 border-t border-white/[0.04]">
              {/* Toolbar Header Label */}
              <div className="hidden sm:flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-400">
                <span>Select active tool:</span>
                <span className={editorMode === 'lightroom' ? 'text-amber-500' : 'text-indigo-400'}>
                  {activeTab === 'adjust' && 'Manual Tuning Sliders'}
                  {activeTab === 'crop' && 'Crop & Rotate'}
                  {activeTab === 'retouch' && 'AI Retouch'}
                  {activeTab === 'filters' && 'AI Magic Filters'}
                </span>
              </div>

              {/* Responsive Tab Bar block mimicking native appbars */}
              <div className={`hidden sm:flex p-1 items-center justify-between gap-1 w-full shadow-lg transition-all duration-300 rounded-xl ${
                editorMode === 'lightroom'
                  ? 'bg-[#18181a] border border-[#2d2d30]'
                  : 'bg-[#18191b]/95 border border-white/[0.05]'
              }`}>
                {tabsToShow.map(tab => {
                     const IconComponent = tab.icon;
                     const isSelected = activeTab === tab.id;
                     return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 transition-all duration-300 text-[10px] font-bold flex-1 select-none rounded-lg ${
                              editorMode === 'lightroom'
                                ? isSelected
                                  ? 'bg-[#1e1e21] border border-[#3c3c3f] text-amber-500 font-extrabold'
                                  : 'text-gray-400 hover:text-gray-200'
                                : isSelected 
                                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-[#f3f4f6]' 
                                  : 'text-gray-400 hover:text-[#f3f4f6] hover:bg-white/[0.02]'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${
                            isSelected 
                              ? editorMode === 'lightroom' ? 'text-amber-500' : 'text-indigo-400' 
                              : 'text-gray-500'
                          }`} />
                          <span>{tab.label}</span>
                        </button>
                     );
                })}
              </div>

              {/* Active panel controls viewport for mobile */}
              <div className="w-full mt-1.5 animate-fade-in text-gray-100">
                {activeTab === 'retouch' && (
                  <div className={`p-4 border rounded-xl flex flex-col gap-3 ${
                    editorMode === 'lightroom' ? 'bg-[#18181b] border-[#2d2d30]' : 'bg-[#131416]/40 border-white/[0.05] backdrop-blur-sm'
                  }`}>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#818cf8] font-bold">AI Retouch Parameter</span>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      {editHotspot ? '✓ Touch pointer locked. Enter prompt below:' : 'Touch any area on the photo above to select.'}
                    </p>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} 
                      className="w-full flex flex-col gap-2 mt-1"
                    >
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={editHotspot ? "e.g., 'change shirt to blue'" : "Select target area first..."}
                        className="w-full bg-black/35 border border-white/[0.08] focus:border-indigo-500/70 font-mono text-xs p-2.5 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none"
                        disabled={isLoading || !editHotspot}
                      />
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-2.5 px-4 text-xs rounded-lg transition-all duration-300 hover:opacity-90 active:scale-95 shadow-md disabled:from-white/[0.04] disabled:to-white/[0.04] disabled:text-gray-600 disabled:cursor-not-allowed"
                        disabled={isLoading || !prompt.trim() || !editHotspot}
                      >
                        Process Generative AI
                      </button>
                    </form>
                  </div>
                )}
                {activeTab === 'crop' && (
                  <CropPanel 
                    onApplyCrop={handleApplyCrop} 
                    onSetAspect={setAspect} 
                    isLoading={isLoading} 
                    isCropping={!!completedCrop?.width && completedCrop.width > 0} 
                  />
                )}
                {activeTab === 'filters' && (
                  <FilterPanel 
                    onApplyFilter={handleApplyFilter} 
                    isLoading={isLoading} 
                  />
                )}
                {activeTab === 'adjust' && (
                  <AdjustmentPanel 
                    params={adjustParams} 
                    onChange={setAdjustParams} 
                    onApply={handleApplyLocalAdjustment} 
                    onReset={handleResetSliders} 
                    histogramData={histogramData} 
                    isLoading={isLoading} 
                    editorMode={editorMode}
                  />
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (Live Adjustments Tuning sliders) */}
          <div className="hidden lg:flex flex-col gap-4 w-full">
            <AdjustmentPanel 
              params={adjustParams} 
              onChange={setAdjustParams} 
              onApply={handleApplyLocalAdjustment} 
              onReset={handleResetSliders} 
              histogramData={histogramData} 
              isLoading={isLoading} 
              editorMode={editorMode}
            />
          </div>

        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col bg-[#0b0c0d]">
      {!currentImageUrl && <Header />}
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-6 flex items-center justify-center`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;