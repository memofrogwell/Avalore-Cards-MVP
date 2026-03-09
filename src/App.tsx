/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Sparkles, Box, Loader2, Wallet, LayoutGrid } from 'lucide-react';
import { CardPack } from './components/CardPack';

// Extend Window interface for Ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Card Types
type Rarity = 'Common' | 'Rare';

interface CardData {
  id: number;
  uniqueId: string; // Added for collection uniqueness
  name: string;
  rarity: Rarity;
  image: string;
  isFlipped: boolean;
  mintedAt: number; // Added timestamp
}

// Mock Data
const CARDS = {
  COMMON: [
    { name: 'Trading Aloha', image: 'https://i.postimg.cc/hjdVhgtt/Aloha.png' },
    { name: 'Arena Man', image: 'https://i.postimg.cc/xCzLqY1J/Arena.png' },
    { name: 'Smitty & Kieks', image: 'https://i.postimg.cc/762SbDZ2/Dn_D.png' },
    { name: 'Giraffe', image: 'https://i.postimg.cc/d1yGDvVL/Giraffe.png' },
    { name: 'Nobs', image: 'https://i.postimg.cc/B6K2tsn1/Nobs.png' },
    { name: 'Voh', image: 'https://i.postimg.cc/wMYLmP1t/Voh.png' },
  ],
  RARE: [
    { name: 'Smitty', image: 'https://i.postimg.cc/90HZ7SD9/Smitty.png' },
    { name: 'Studdle', image: 'https://i.postimg.cc/VvPnCTJJ/Studdle.png' },
    { name: 'Tactical', image: 'https://i.postimg.cc/KjhBMV13/TR.png' },
    { name: 'Wrath', image: 'https://i.postimg.cc/BbfHKyjD/Wrath.png' },
  ],
};

export default function App() {
  const [isOpening, setIsOpening] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [packOpened, setPackOpened] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  
  // New State
  const [view, setView] = useState<'mint' | 'collection'>('mint');
  const [collection, setCollection] = useState<CardData[]>(() => {
    const saved = localStorage.getItem('avalore_collection');
    return saved ? JSON.parse(saved) : [];
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Collection Sorting & Filtering
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rarity_high' | 'rarity_low'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'Common' | 'Rare'>('all');

  const filteredCollection = React.useMemo(() => {
    let result = [...collection];

    // Filter
    if (filterBy !== 'all') {
      result = result.filter(card => card.rarity === filterBy);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.mintedAt || 0) - (a.mintedAt || 0);
        case 'oldest':
          return (a.mintedAt || 0) - (b.mintedAt || 0);
        case 'rarity_high':
          // Rare > Common
          if (a.rarity === b.rarity) return 0;
          return a.rarity === 'Rare' ? -1 : 1;
        case 'rarity_low':
          // Common > Rare
          if (a.rarity === b.rarity) return 0;
          return a.rarity === 'Common' ? -1 : 1;
        default:
          return 0;
      }
    });

    return result;
  }, [collection, sortBy, filterBy]);

  useEffect(() => {
    localStorage.setItem('avalore_collection', JSON.stringify(collection));
  }, [collection]);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const connectWallet = async () => {
    setNotification("Simulating wallet connection...");
    setTimeout(() => {
      const fakeAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setWalletAddress(fakeAddress);
      setNotification("Wallet connected!");
    }, 1000);
  };

  const mintPack = async () => {
    if (!walletAddress) {
      setNotification("Connecting wallet...");
      await connectWallet();
      return;
    }

    setIsOpening(true);
    setPackOpened(false);
    setSkipAnimation(false);
    setCards([]);

    // Simulate Blockchain Delay
    setTimeout(() => {
      const newCards: CardData[] = [];
      const timestamp = Date.now();

      // Logic: 3 Random (90% Common, 10% Rare), 1 Guaranteed Rare
      for (let i = 0; i < 4; i++) {
        let isRare = false;

        if (i === 3) {
          // 4th card is Guaranteed Rare
          isRare = true;
        } else {
          // 10% chance of Rare for the first 3
          isRare = Math.random() < 0.1;
        }

        const rarity: Rarity = isRare ? 'Rare' : 'Common';
        const pool = isRare ? CARDS.RARE : CARDS.COMMON;
        const randomCard = pool[Math.floor(Math.random() * pool.length)];

        newCards.push({
          id: i,
          uniqueId: `${timestamp}-${i}`,
          name: randomCard.name,
          rarity: rarity,
          image: randomCard.image,
          isFlipped: false,
          mintedAt: timestamp,
        });
      }

      setCards(newCards);
      setCollection(prev => [...prev, ...newCards]);
      setIsOpening(false);
      setPackOpened(true);
    }, 2000);
  };

  const flipCard = (id: number) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    );
  };

  // Helper to format address
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col items-center p-4 perspective-2000 overflow-x-hidden"
      onClick={() => {
        if (packOpened && !skipAnimation && view === 'mint') {
          setSkipAnimation(true);
        }
      }}
    >
      {/* Navigation & Wallet Header */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-8 p-4 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 sticky top-4 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('mint')}
            className={`flex items-center gap-2 font-mono text-sm tracking-wider transition-colors ${view === 'mint' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Box className="w-4 h-4" />
            MINT
          </button>
          <button 
            onClick={() => setView('collection')}
            className={`flex items-center gap-2 font-mono text-sm tracking-wider transition-colors ${view === 'collection' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            MY COLLECTION
          </button>
        </div>

        <button
          onClick={connectWallet}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
            walletAddress 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50' 
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          <Wallet className="w-4 h-4" />
          {walletAddress ? formatAddress(walletAddress) : 'CONNECT WALLET'}
        </button>
      </nav>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-cyan-500/50 text-cyan-400 px-6 py-3 rounded-xl shadow-2xl z-[100] font-mono text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
          AVALORE CARDS
        </h1>
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
          Avalanche Fuji Testnet MVP
        </p>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-6xl flex flex-col items-center flex-grow">
        
        {view === 'mint' ? (
          <>
            {/* Card Pack & Mint Button */}
            {!packOpened && (
              <div className="flex flex-col items-center gap-8 mb-12">
                {/* 3D Card Pack */}
                <CardPack onClick={!isOpening ? mintPack : undefined} />

                {/* Mint Button / Loading State */}
                <div className="text-center">
                  {isOpening ? (
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-8 h-8 text-cyan-400" />
                      </motion.div>
                      <p className="text-cyan-400 font-mono animate-pulse text-sm">
                        MINTING...
                      </p>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={mintPack}
                      className="group relative px-8 py-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 z-40"
                    >
                      <div className="flex items-center gap-3">
                        <Box className="w-6 h-6 text-cyan-400 group-hover:text-white transition-colors" />
                        <span className="text-xl font-bold text-white tracking-wide">
                          MINT A PACK
                        </span>
                      </div>
                      {/* Button Glow */}
                      <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  )}
                </div>
              </div>
            )}

            {/* Card Grid */}
            <AnimatePresence>
              {packOpened && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                    },
                  }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8"
                >
                  {cards.map((card, index) => (
                    <Card 
                      key={card.id} 
                      card={card} 
                      onFlip={() => flipCard(card.id)} 
                      index={index}
                      skipAnimation={skipAnimation}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset Button (for demo purposes) */}
            {packOpened && cards.every(card => card.isFlipped) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setPackOpened(false)}
                className="mt-12 text-slate-500 hover:text-white text-sm font-mono underline underline-offset-4"
              >
                MINT ANOTHER PACK
              </motion.button>
            )}
          </>
        ) : (
          /* Collection View */
          <div className="w-full">
            {/* Sort & Filter Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Filter:</span>
                <div className="flex gap-2">
                  {(['all', 'Common', 'Rare'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setFilterBy(option)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                        filterBy === option 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                          : 'bg-slate-700/50 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-700/50 text-white text-xs font-mono uppercase px-3 py-1 rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rarity_high">Highest Rarity</option>
                  <option value="rarity_low">Lowest Rarity</option>
                </select>
              </div>
            </div>

            {filteredCollection.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-lg">
                  {collection.length === 0 ? "NO CARDS COLLECTED YET" : "NO CARDS MATCH FILTER"}
                </p>
                {collection.length === 0 && (
                  <button 
                    onClick={() => setView('mint')}
                    className="mt-4 text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                  >
                    Go Mint Your First Pack
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredCollection.map((card, idx) => (
                  <div key={`${card.uniqueId}-${idx}`} className="relative group">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-800 relative transition-transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 cursor-pointer">
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12">
                        <p className={`font-bold text-sm ${card.rarity === 'Rare' ? 'text-cyan-300' : 'text-white'}`}>
                          {card.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] font-mono uppercase tracking-wider ${
                            card.rarity === 'Rare' ? 'text-purple-400' : 'text-slate-400'
                          }`}>
                            {card.rarity}
                          </span>
                        </div>
                      </div>
                      {/* Rarity Indicator */}
                      {card.rarity === 'Rare' && (
                        <div className="absolute top-2 right-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  key?: React.Key;
  card: CardData;
  onFlip: () => void;
  index: number;
  skipAnimation: boolean;
}

function Card({ card, onFlip, index, skipAnimation }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Motion values for zoom tilt
  const zoomX = useMotionValue(0);
  const zoomY = useMotionValue(0);

  // Smooth spring physics for tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 });

  // Smooth spring physics for zoom tilt
  const zoomRotateX = useSpring(useTransform(zoomY, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 });
  const zoomRotateY = useSpring(useTransform(zoomX, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 });

  // Flip animation
  const flipSpring = useSpring(0, { stiffness: 150, damping: 20 });
  useEffect(() => {
    flipSpring.set(card.isFlipped ? 180 : 0);
  }, [card.isFlipped, flipSpring]);

  // Combine flip and tilt
  const combinedRotateY = useTransform([flipSpring, rotateY], ([f, t]: any[]) => f + t);
  
  // Combine flip and zoom tilt (zoomed card is always flipped to back, so base rotation is 180)
  // Actually, for the zoomed card, we just want the tilt on top of the static 180 rotation.
  // But wait, the zoomed card is rendered as `rotate-y-180` in CSS class?
  // Let's check the zoomed card JSX.
  // It has `rotate-y-180` class on the inner div.
  // And the container has `rotateY: combinedRotateY`.
  // If we use a new transform, we should just apply the tilt.
  // The zoomed card is ALREADY showing the back face.
  // So we don't need the flip animation spring for the zoomed card, it's static.
  // We just need the tilt.
  
  // However, the original code used `combinedRotateY` which includes `flipSpring`.
  // `flipSpring` is 180 when flipped.
  // So `combinedRotateY` is 180 + tilt.
  // The zoomed card container has `rotateY: combinedRotateY`.
  // And the inner div has `rotate-y-180` (which is `transform: rotateY(180deg)`).
  // Wait, if the container is rotated 180, and the inner div is rotated 180, that would be 360 (front face).
  // Let's check the original code again.
  
  // Original zoomed card JSX:
  // <motion.div ... style={{ rotateX: rotateX, rotateY: combinedRotateY }}>
  //   <div className="... rotate-y-180 ..."> ... </div>
  // </motion.div>
  
  // If `card.isFlipped` is true, `flipSpring` is 180.
  // `rotateY` is small tilt (e.g., 5).
  // `combinedRotateY` is 185.
  // Container rotates 185.
  // Inner div has `rotate-y-180`.
  // This seems redundant or I'm misunderstanding `backface-hidden`.
  // Ah, `backface-hidden` hides the back face.
  // If container is at 180, we are looking at the "back" of the container.
  // The inner div is rotated 180 relative to the container.
  // So 180 + 180 = 360. We are looking at the front of the inner div?
  // Or maybe the inner div IS the back face content.
  
  // Let's look at the grid card.
  // It has Front Face (no rotation) and Back Face (rotate-y-180).
  // When container rotates 180, the Front Face (0) is now at 180 (facing away).
  // The Back Face (180) is now at 360 (facing towards us).
  // So that works.
  
  // For the zoomed card, we are ONLY rendering the Back Face content.
  // And we are wrapping it in a motion.div that rotates.
  // If we want it to face us, the net rotation should be 0 or 360.
  // If the inner div is `rotate-y-180`, then the container needs to be `rotateY(180)` to make it face us.
  // So yes, we need a base of 180 for the container.
  
  const zoomCombinedRotateY = useTransform(zoomRotateY, (t: any) => 180 + t);


  // Shine effect (constantly animated)
  const shineX = useSpring(0, { stiffness: 50, damping: 10 });
  const shineY = useSpring(0, { stiffness: 50, damping: 10 });

  // Animate shine constantly
  useLayoutEffect(() => {
    if (card.rarity !== 'Rare') return;
    
    const animateShine = () => {
      const time = Date.now() / 1000;
      const x = Math.sin(time) * 50 + 50; // 0 to 100
      const y = Math.cos(time * 0.7) * 50 + 50; // 0 to 100
      shineX.set(x);
      shineY.set(y);
      requestAnimationFrame(animateShine);
    };
    
    const animationId = requestAnimationFrame(animateShine);
    return () => cancelAnimationFrame(animationId);
  }, [card.rarity, shineX, shineY]);
  
  // Transform to percentage strings for CSS
  const shineXStr = useTransform(shineX, (val) => `${val}%`);
  const shineYStr = useTransform(shineY, (val) => `${val}%`);

  const [isZoomed, setIsZoomed] = useState(false);
  const [showShine, setShowShine] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.isFlipped) {
      onFlip();
    } else {
      setIsZoomed(!isZoomed);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !card.isFlipped) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    zoomX.set(xPct);
    zoomY.set(yPct);
  };

  const handleZoomMouseLeave = () => {
    zoomX.set(0);
    zoomY.set(0);
  };

  return (
    <>
      {/* Zoom Overlay */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsZoomed(false)}
          >
            <div 
              className="relative w-full max-w-sm aspect-[2/3] perspective-1000"
              onMouseMove={handleZoomMouseMove}
              onMouseLeave={handleZoomMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="w-full h-full relative transform-style-3d"
                style={{
                  rotateX: zoomRotateX,
                  rotateY: zoomCombinedRotateY,
                }}
              >
                {/* Zoomed Card Content (Back Face Only since it's already flipped) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-2xl bg-slate-800 border border-slate-700">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-6 pt-24 pointer-events-none">
                    <p className={`font-bold text-3xl ${card.rarity === 'Rare' ? 'text-cyan-300' : 'text-white'}`}>
                      {card.name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-mono uppercase tracking-wider ${
                        card.rarity === 'Rare' ? 'text-purple-400' : 'text-slate-400'
                      }`}>
                        {card.rarity}
                      </span>
                      {card.rarity === 'Rare' && <Sparkles className="w-6 h-6 text-cyan-400" />}
                    </div>
                  </div>

                  {card.rarity === 'Rare' && (
                    <motion.div 
                      className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10"
                      style={{
                        background: `linear-gradient(115deg, transparent 20%, rgba(34, 211, 238, 0.4) 40%, rgba(168, 85, 247, 0.4) 60%, transparent 80%)`,
                        backgroundSize: '300% 300%',
                        backgroundPositionX: shineXStr,
                        backgroundPositionY: shineYStr,
                        opacity: 0.8
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Card */}
      <motion.div
        ref={ref}
        className="relative w-56 h-80 cursor-pointer perspective-1000 group"
        onClick={handleCardClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onAnimationStart={(definition) => {
          if (definition === 'visible') {
            setShowShine(true);
          }
        }}
        variants={{
          hidden: { opacity: 0, y: -100, scale: 1.1 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              delay: skipAnimation ? 0 : index * 0.8,
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              mass: 1.2
            } 
          },
        }}
      >
        {/* Drop Shine Effect - Triggered by state to ensure timing */}
        {showShine && !card.isFlipped && (
          <div className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, left: '-100%' }}
              animate={{ 
                opacity: [0, 1, 0], 
                left: '200%' 
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut", 
                delay: 0.1 
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
          </div>
        )}

        <motion.div
          className="w-full h-full relative transform-style-3d"
          animate={{
            scale: card.isFlipped ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
          style={{
            rotateX: rotateX,
            rotateY: combinedRotateY,
          }}
        >
          {/* FRONT FACE (Face Down) */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="w-full h-full bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center shadow-xl group-hover:border-cyan-500/50 transition-colors overflow-hidden relative">
              
              <div className="text-center opacity-50">
                <Box className="w-12 h-12 mx-auto mb-2 text-cyan-500" />
                <p className="font-mono text-xs tracking-widest">AVALORE</p>
              </div>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* BACK FACE (Face Up) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-2xl bg-slate-800 border border-slate-700">
            {/* Image */}
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-4 pt-16 pointer-events-none">
              <p className={`font-bold text-lg ${card.rarity === 'Rare' ? 'text-cyan-300' : 'text-white'}`}>
                {card.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-mono uppercase tracking-wider ${
                  card.rarity === 'Rare' ? 'text-purple-400' : 'text-slate-400'
                }`}>
                  {card.rarity}
                </span>
                {card.rarity === 'Rare' && <Sparkles className="w-4 h-4 text-cyan-400" />}
              </div>
            </div>

            {/* Flash Effect on Flip */}
            <AnimatePresence>
              {card.isFlipped && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
                />
              )}
            </AnimatePresence>

            {/* Holographic Shine for Rares */}
            {card.rarity === 'Rare' && (
              <motion.div 
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-10"
                style={{
                  background: `linear-gradient(115deg, transparent 20%, rgba(34, 211, 238, 0.4) 40%, rgba(168, 85, 247, 0.4) 60%, transparent 80%)`,
                  backgroundSize: '300% 300%',
                  backgroundPositionX: shineXStr,
                  backgroundPositionY: shineYStr,
                  opacity: 0.8
                }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
