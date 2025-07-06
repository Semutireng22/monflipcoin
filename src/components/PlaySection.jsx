import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

// Varian animasi untuk komponen utama (tidak berubah)
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

// Varian animasi untuk Koin (tidak berubah)
const coinVariants = {
  idle: {
    rotateY: 0,
    transition: { duration: 0.4 }
  },
  flipping: {
    rotateY: [0, 720, 1080], 
    transition: {
      duration: 1.8, 
      ease: "easeOut",
    }
  }
};


const PlaySection = ({
  choice, setChoice, bet, setBet, flipCoin, result, resultType,
  isConnected, gamePoolBalance, coinResult, isFlipping, theme, wins, losses
}) => {

  const coinImage = isFlipping
    ? `/assets/coin-NATURAL.png` 
    : coinResult
    ? `/assets/coin-${coinResult.toUpperCase()}.png`
    : choice
    ? `/assets/coin-${choice.toUpperCase()}.png`
    : '/assets/coin-NATURAL.png';                     
  
  const handleQuickBet = (type) => {
    if (isFlipping) return;
    const currentBet = parseFloat(bet) || 0;
    if (type === '2x') {
      setBet((currentBet * 2).toFixed(4).replace(/\.?0+$/, ""));
    } else if (type === 'max') {
      const maxBet = gamePoolBalance && gamePoolBalance !== 'N/A' ? (parseFloat(gamePoolBalance) / 2).toString() : '0.01';
      setBet(maxBet);
    } else {
      setBet(type);
    }
  };

  const getResultClasses = () => {
    switch (resultType) {
      case 'success': return 'bg-green-500/10 text-green-300 border-green-500/50 shadow-lg shadow-green-500/20';
      case 'lose':
      case 'error': return 'bg-red-500/10 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-300 border-blue-500/50';
      default: return 'opacity-0 border-transparent';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="game-panel"
    >
      {/* --- STATS DISPLAY --- */}
      <motion.div variants={itemVariants} className="absolute top-4 right-4 bg-black/40 px-3 py-1 rounded-md border border-white/10 text-xs shadow-md">
        <span className="font-bold text-green-400">W: {wins}</span>
        <span className="text-gray-500 mx-1.5">/</span>
        <span className="font-bold text-red-400">L: {losses}</span>
      </motion.div>

      {/* --- COIN PORTAL --- */}
      <motion.div variants={itemVariants} className="flex justify-center mb-6">
        <div className="coin-portal">
          <motion.div
            key={coinImage}
            // === PERBAIKAN DI SINI ===
            // w-full h-full -> Membuat ukuran div koin sama dengan parent-nya (.coin-portal)
            // rounded-full -> Memaksa div menjadi bulat, menghilangkan "sudut" atau "border kotak"
            className="w-full h-full rounded-full bg-contain bg-no-repeat bg-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            style={{ backgroundImage: `url(${coinImage})` }}
            variants={coinVariants}
            animate={isFlipping ? "flipping" : "idle"}
          />
        </div>
      </motion.div>
      
      {/* Sisa kode JSX di bawah ini tidak ada perubahan */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
        <button onClick={() => setChoice('head')} disabled={isFlipping} className={`btn-choice-3d ${choice === 'head' ? 'active' : ''}`}>
          HEAD
        </button>
        <button onClick={() => setChoice('tail')} disabled={isFlipping} className={`btn-choice-3d ${choice === 'tail' ? 'active' : ''}`}>
          TAIL
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <label htmlFor="betAmount" className="block text-sm font-bold text-gray-400 mb-2 text-center tracking-widest">SET YOUR BET</label>
        <div className="flex items-stretch gap-3">
          <input
            type="number"
            id="betAmount"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            disabled={isFlipping}
            className="input-digital flex-grow"
            placeholder="0.01"
          />
          <button 
            onClick={flipCoin} 
            disabled={isFlipping || !isConnected || !choice} 
            className="btn-action-3d !py-0 px-6 text-lg"
          >
            {isFlipping ? <FaSpinner className="animate-spin" /> : 'FLIP'}
          </button>
        </div>
        <div className="flex justify-center gap-2 sm:gap-3 pt-2">
          {['0.01', '0.1', '0.5', '1', '2x', 'max'].map((val) => (
            <button 
              key={val} 
              onClick={() => handleQuickBet(val)} 
              disabled={isFlipping} 
              className="bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600 rounded-md text-xs sm:text-sm font-bold py-2 px-3 sm:px-4 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {val.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="h-14 flex items-center justify-center mt-6">
        <div className={`w-full text-center font-semibold p-3 rounded-lg border transition-all duration-300 ${getResultClasses()}`}>
          <AnimatePresence mode="wait">
            <motion.span
              key={result || 'initial'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {result}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default PlaySection;