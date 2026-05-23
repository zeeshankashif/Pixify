/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center select-none z-30 bg-[#060607]/80 backdrop-blur-md rounded-2xl overflow-hidden animate-fade-in">
      <style>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(0.96);
            filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.5)) drop-shadow(0 0 25px rgba(138, 43, 226, 0.25));
          }
          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 22px rgba(0, 240, 255, 0.85)) drop-shadow(0 0 40px rgba(138, 43, 226, 0.5));
          }
        }

        @keyframes shimmerWave {
          0% {
            stroke-dashoffset: 560;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes microRotateClockwise {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes microRotateCounter {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes bloomPulse {
          0%, 100% {
            opacity: 0.18;
            transform: scale(0.9);
          }
          50% {
            opacity: 0.35;
            transform: scale(1.15);
          }
        }

        .spinner-container {
          animation: heartbeat 1.8s infinite ease-in-out;
        }

        .vortex-dust-clockwise {
          transform-origin: center;
          animation: microRotateClockwise 15s infinite linear;
        }

        .vortex-dust-counter {
          transform-origin: center;
          animation: microRotateCounter 22s infinite linear;
        }

        .shimmer-wave-stroke {
          stroke-dasharray: 120 440;
          animation: shimmerWave 1.8s infinite ease-in-out;
        }

        .bloom-layer {
          animation: bloomPulse 3.6s infinite ease-in-out;
        }
      `}</style>

      {/* Embedded Ambient Neon Bloom Blur Layer */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full pointer-events-none z-0 bloom-layer"
        style={{
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.35) 0%, rgba(138, 43, 226, 0.3) 50%, transparent 75%)',
          filter: 'blur(35px)'
        }}
      />

      {/* Main Vector Motion Assembly */}
      <div className="relative flex items-center justify-center z-10 w-44 h-44 spinner-container">
        
        {/* SVG Core Assembly */}
        <svg 
          className="w-full h-full overflow-visible" 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Neon Cyan Inner Dense Sparkle Constellation */}
          <g className="vortex-dust-clockwise">
            {Array.from({ length: 48 }).map((_, idx) => {
              const angle = (idx * Math.PI * 2) / 48;
              const r = 50 + Math.sin(idx * 0.8) * 4; // micro wave displacement
              const px = 100 + Math.cos(angle) * r;
              const py = 100 + Math.sin(angle) * r;
              return (
                <circle 
                  key={`c-cw-${idx}`} 
                  cx={px} 
                  cy={py} 
                  r={0.6 + (idx % 3) * 0.3} 
                  fill="#00f0ff" 
                  className="opacity-70"
                />
              );
            })}
          </g>

          {/* Opposing Outer Cyan Constellation */}
          <g className="vortex-dust-counter">
            {Array.from({ length: 64 }).map((_, idx) => {
              const angle = (idx * Math.PI * 2) / 64;
              const r = 70 + Math.cos(idx * 0.6) * 5; // offset wave displacement
              const px = 100 + Math.cos(angle) * r;
              const py = 100 + Math.sin(angle) * r;
              return (
                <circle 
                  key={`c-ccw-${idx}`} 
                  cx={px} 
                  cy={py} 
                  r={0.4 + (idx % 2) * 0.4} 
                  fill="#00f0ff" 
                  className="opacity-50"
                />
              );
            })}
          </g>

          {/* Micro filaments of spiral rays */}
          <g className="vortex-dust-clockwise opacity-40">
            {Array.from({ length: 16 }).map((_, idx) => {
              const angle = (idx * Math.PI * 2) / 16;
              const px1 = 100 + Math.cos(angle) * 35;
              const py1 = 100 + Math.sin(angle) * 35;
              const px2 = 100 + Math.cos(angle + 0.3) * 85;
              const py2 = 100 + Math.sin(angle + 0.3) * 85;
              return (
                <path 
                  key={`ray-${idx}`}
                  d={`M ${px1} ${py1} Q ${100 + Math.cos(angle + 0.15) * 60} ${100 + Math.sin(angle + 0.15) * 60}, ${px2} ${py2}`}
                  stroke="url(#filamentGradient)"
                  strokeWidth="0.4"
                  strokeDasharray="4 8"
                />
              );
            })}
          </g>

          {/* Seamless base glowing neon cyan circle (filament) */}
          <circle 
            cx="100" 
            cy="100" 
            r="60" 
            stroke="url(#vortexRingGrad)" 
            strokeWidth="1.5" 
            className="opacity-80"
          />

          {/* The flowing concentrated electric violet shimmering wave */}
          <circle 
            cx="100" 
            cy="100" 
            r="60" 
            stroke="url(#shimmerRingGrad)" 
            strokeWidth="3.2" 
            strokeLinecap="round"
            className="shimmer-wave-stroke"
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />

          <defs>
            {/* Filament Radial Glow Gradient */}
            <linearGradient id="vortexRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.8" />
            </linearGradient>

            {/* Shimmering Violet wave gradient */}
            <linearGradient id="shimmerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(138, 43, 226, 0)" />
              <stop offset="45%" stopColor="#8a2be2" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#c084fc" /> {/* super glowing violet peak */}
              <stop offset="55%" stopColor="#8a2be2" stopOpacity="0.85" />
              <stop offset="100%" stopColor="rgba(138, 43, 226, 0)" />
            </linearGradient>

            {/* Inward Filament Spiral Gradient */}
            <radialGradient id="filamentGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#8a2be2" stopOpacity="0.6" />
            </radialGradient>
          </defs>
        </svg>

      </div>
    </div>
  );
};

export default Spinner;
