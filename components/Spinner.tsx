/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none z-30 bg-[#0a0a0a]/75 backdrop-blur-md rounded-2xl overflow-hidden animate-fade-in">
      <style>{`
        @keyframes geminiShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.95) translate(-50%, -50%);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08) translate(-50%, -50%);
          }
        }

        @keyframes waveFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(3deg);
          }
        }

        .gemini-shimmer-track {
          background: linear-gradient(
            90deg,
            #1e1e1e 0%,
            #1e1e1e 25%,
            #00f0ff 40%,
            #8a2be2 50%,
            #00f0ff 60%,
            #1e1e1e 75%,
            #1e1e1e 100%
          );
          background-size: 200% 100%;
          animation: geminiShimmer 1.8s infinite ease-in-out;
        }

        .gemini-aurora-glow {
          background: radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(138, 43, 226, 0.45) 50%, rgba(0, 0, 0, 0) 70%);
          transform-origin: top left;
          animation: pulseGlow 3s infinite ease-in-out;
        }

        .floating-element {
          animation: waveFloat 4s infinite ease-in-out;
        }
      `}</style>

      {/* Extreme Vibrant Ambient Backdrop Colorful Glow */}
      <div className="absolute top-1/2 left-1/2 w-[480px] h-[480px] rounded-full filter blur-[80px] pointer-events-none z-0 gemini-aurora-glow" />

      {/* Floating Sparkle Wave Mask */}
      <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-md px-12 text-center floating-element">
        {/* Gemini Sparkle Core Indicator */}
        <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#00f0ff]/20 animate-ping opacity-75" />
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#00f0ff]/30 to-[#8a2be2]/30 blur-md animate-pulse" />
          
          {/* Elegant Geometric Sparkle */}
          <svg className="w-10 h-10 relative z-10 drop-shadow-[0_0_12px_rgba(0,240,255,0.85)]" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2"
              fill="url(#geminiSparkGrad)"
            />
            <defs>
              <linearGradient id="geminiSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#8a2be2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Shimmer Wave Track Indicator */}
        <div className="w-full h-[6px] rounded-full bg-[#1e1e1e] border border-white/[0.04] p-[1px] shadow-2xl overflow-hidden mb-4">
          <div className="h-full w-full rounded-full gemini-shimmer-track" />
        </div>

        {/* Minimal dynamic state status text */}
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#00f0ff]/85 uppercase font-mono animate-pulse">
            SYNTHESIZING
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-gray-400 select-none">
            Generative rendering engine active
          </span>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
