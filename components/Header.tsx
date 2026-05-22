/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-3.5 px-6 border-b border-white/[0.06] bg-[#0c0d0e]/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 shadow-inner">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-sm font-bold tracking-widest text-[#f3f4f6] uppercase">
            PIXIFY <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-black">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400/80 font-mono tracking-wider uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 animate-pulse"></span>
          Studio Mode
        </div>
      </div>
    </header>
  );
};

export default Header;
