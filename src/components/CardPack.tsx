import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'motion/react';
import { Sparkles, Loader2 } from 'lucide-react';

interface CardPackProps {
  onClick?: () => void;
}

export function CardPack({ onClick }: CardPackProps) {
  const x = useMotionValue(0);
  const rotateY = useTransform(x, (value) => value / 2); // Adjust sensitivity

  // Shine effect
  const shineX = useSpring(0, { stiffness: 50, damping: 10 });
  const shineY = useSpring(0, { stiffness: 50, damping: 10 });

  const handleDrag = (event: any, info: PanInfo) => {
    x.set(x.get() + info.delta.x);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    
    shineX.set(xPct * 100);
    shineY.set(yPct * 100);
  };

  return (
    <div className="relative perspective-1000 w-64 h-96 cursor-grab active:cursor-grabbing" onClick={onClick}>
      <motion.div
        className="w-full h-full relative transform-style-3d"
        style={{ rotateY }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDrag={handleDrag}
        onMouseMove={handleMouseMove}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Card Pack Face */}
        <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 backface-hidden flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          
          <div className="relative z-10 w-full h-full border-2 border-cyan-500/30 rounded-lg flex flex-col items-center justify-between py-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter uppercase transform -skew-x-6">
                Avalore
              </h2>
              <p className="text-cyan-400 font-mono text-xs tracking-widest mt-1">SERIES 1</p>
            </div>
            
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            
            <div className="text-center">
              <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Trading Cards</p>
            </div>
          </div>
          
          {/* Shine Overlay */}
          <motion.div 
            className="absolute inset-0 pointer-events-none mix-blend-overlay z-10"
            style={{
              background: `linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.3) 60%, transparent 80%)`,
              backgroundSize: '200% 200%',
              backgroundPositionX: useTransform(shineX, (val) => `${val}%`),
              backgroundPositionY: useTransform(shineY, (val) => `${val}%`),
            }}
          />
          
          {/* Static Shine for 3D effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* Card Pack Back (Simple) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700 backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-slate-500 font-mono text-xs text-center p-4">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              CONTAINS 4 CARDS
              <br/>
              1 GUARANTEED RARE
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
