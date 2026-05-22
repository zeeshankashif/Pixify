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
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
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
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
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
      <div className="relative">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
            <img
                key={originalImageUrl}
                src={originalImageUrl}
                alt="Original"
                className="w-full h-auto object-contain max-h-[60vh] rounded-xl pointer-events-none"
            />
        )}
        {/* The current image is an overlay that fades in/out for comparison */}
        <img
            ref={imgRef}
            key={currentImageUrl}
            src={currentImageUrl}
            alt="Current"
            onClick={handleImageClick}
            className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${isComparing ? 'opacity-0' : 'opacity-100'} ${activeTab === 'retouch' ? 'cursor-crosshair' : ''}`}
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


    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in bg-[#131416]/40 p-6 md:p-8 border border-white/[0.05] rounded-3xl backdrop-blur-md shadow-2xl">
        <div className="relative w-full shadow-2xl rounded-2xl border border-white/[0.06] overflow-hidden bg-[#0c0d0e]/40">
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xl z-30 flex flex-col items-center justify-center overflow-hidden rounded-2xl animate-fade-in">
                    <Spinner />
                </div>
            )}
            
            {activeTab === 'crop' ? (
              <ReactCrop 
                crop={crop} 
                onChange={c => setCrop(c)} 
                onComplete={c => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[60vh] flex items-center justify-center"
              >
                {cropImageElement}
              </ReactCrop>
            ) : imageDisplay }

            {displayHotspot && !isLoading && activeTab === 'retouch' && (
                <div 
                    className="absolute rounded-full w-6 h-6 bg-[#6366f1]/60 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
                >
                    <div className="absolute inset-0 rounded-full w-6 h-6 animate-ping bg-[#818cf8]"></div>
                </div>
            )}
        </div>
        
        {/* Modern integrated pills/tabs bar */}
        <div className="w-full flex justify-center mt-2">
            <div className="bg-[#18191b]/95 border border-white/[0.05] rounded-full p-1.5 flex items-center justify-between gap-1 max-w-lg w-full backdrop-blur-md shadow-xl">
                {([
                  { id: 'retouch', label: 'Retouch', icon: Sparkles },
                  { id: 'crop', label: 'Crop', icon: CropIcon },
                  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
                  { id: 'filters', label: 'Filters', icon: Palette }
                ] as { id: Tab, label: string, icon: React.FC<{ className?: string }> }[]).map(tab => {
                     const IconComponent = tab.icon;
                     return (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-2 font-medium py-2.5 px-3 rounded-full transition-all duration-300 text-xs select-none ${
                                activeTab === tab.id 
                                ? 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-[#f3f4f6] shadow-sm font-bold' 
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                            }`}
                        >
                            <IconComponent className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-indigo-400' : 'text-gray-400'}`} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                     );
                })}
            </div>
        </div>
        
        <div className="w-full mt-2">
            {activeTab === 'retouch' && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-xs text-gray-400/80 uppercase tracking-widest font-mono">
                        {editHotspot ? '✓ Touch pointer locked. Enter prompt below.' : 'Touch anywhere on the image tool area to modify.'}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="w-full flex items-center relative bg-white/[0.02] border border-white/[0.08] focus-within:border-indigo-500/40 rounded-full pl-6 pr-2 py-2 shadow-2xl transition duration-300">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={editHotspot ? "e.g., 'change my shirt color to blue', 'remove person'" : "Touch a focal spot first..."}
                            className="flex-grow bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none w-full disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading || !editHotspot}
                        />
                        <button 
                            type="submit"
                            className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-2.5 px-6 text-xs rounded-full transition-all duration-300 ease-in-out hover:opacity-90 active:scale-95 shadow-[0_2px_12px_rgba(99,102,241,0.2)] disabled:from-white/[0.04] disabled:to-white/[0.04] disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
                            disabled={isLoading || !prompt.trim() || !editHotspot}
                        >
                            Generate
                        </button>
                    </form>
                </div>
            )}
            {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop?.width && completedCrop.width > 0} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-white/[0.03] border border-white/[0.06] text-gray-200 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white/[0.06] active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.01]"
                aria-label="Undo last action"
            >
                <Undo2 className="w-4 h-4 mr-1.5" />
                Undo
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center text-center bg-white/[0.03] border border-white/[0.06] text-gray-200 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white/[0.06] active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.01]"
                aria-label="Redo last action"
            >
                <Redo2 className="w-4 h-4 mr-1.5" />
                Redo
            </button>
            
            <div className="h-6 w-px bg-[#18191b]/80 mx-1 hidden sm:block"></div>

            {canUndo && (
              <button 
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="flex items-center justify-center text-center bg-white/[0.03] border border-white/[0.06] text-gray-200 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white/[0.06] active:scale-95 text-xs"
                  aria-label="Press and hold to see original image"
              >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Compare
              </button>
            )}

            <button 
                onClick={handleReset}
                disabled={!canUndo}
                className="flex items-center justify-center text-center bg-transparent border border-white/[0.08] text-gray-300 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white/[0.03] active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
            </button>
            <button 
                onClick={handleUploadNew}
                className="flex items-center justify-center text-center bg-white/[0.03] border border-white/[0.06] text-gray-200 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white/[0.06] active:scale-95 text-xs"
            >
                <Upload className="w-4 h-4 mr-1.5" />
                Upload New
            </button>

            <button 
                onClick={handleDownload}
                className="flex-grow sm:flex-grow-0 ml-auto bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-2.5 px-5 rounded-full transition-all duration-200 ease-in-out hover:opacity-90 active:scale-95 text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.25)]"
            >
                <Download className="w-4 h-4" />
                Download Image
            </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${currentImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;