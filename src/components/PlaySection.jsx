import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import { formatEther } from 'ethers';

// ===== Variants (animasi) =====
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const coinVariants = {
  idle: {
    rotateY: 0,
    transition: { duration: 0.4 },
  },
  flipping: {
    rotateY: [0, 720, 1080],
    transition: { duration: 1.8, ease: 'easeOut' },
  },
};

const PlaySection = ({
  choice,
  setChoice,
  bet,
  setBet,
  flipCoin,
  result,
  resultType,
  displayMessage,
  isConnected,
  gamePoolBalance,
  coinResult,
  isFlipping,
  explorerUrl,
  contractAddress,
  theme,
  wins,
  losses,
  gasStats, // { estimated, limit, used, price, estCost, actualCost, submitHash, callbackHash }
}) => {
  // Tentukan gambar koin
  const coinImage = isFlipping
    ? `/assets/coin-NATURAL.png`
    : coinResult
    ? `/assets/coin-${coinResult.toUpperCase()}.png`
    : choice
    ? `/assets/coin-${choice.toUpperCase()}.png`
    : `/assets/coin-NATURAL.png`;

  // Quick bet helper
  const handleQuickBet = (type) => {
    if (isFlipping) return;
    const currentBet = parseFloat(bet) || 0;

    if (type === '2x') {
      const doubled = (currentBet * 2).toFixed(4).replace(/\.?0+$/, '');
      setBet(doubled);
      return;
    }

    if (type === 'max') {
      const maxBet =
        gamePoolBalance && gamePoolBalance !== 'N/A'
          ? (parseFloat(gamePoolBalance) / 2).toString()
          : '0.01';
      setBet(maxBet);
      return;
    }

    setBet(type);
  };

  // Kelas style hasil
  const getResultClasses = () => {
    switch (resultType) {
      case 'success':
        return 'bg-green-500/10 text-green-300 border-green-500/50 shadow-lg shadow-green-500/20';
      case 'lose':
      case 'error':
        return 'bg-red-500/10 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/50';
      default:
        return 'opacity-0 border-transparent';
    }
  };

  // Validasi kecil di sisi UI
  const minBet = 0.01;
  const betNum = parseFloat(bet || '0') || 0;
  const betTooSmall = betNum > 0 && betNum < minBet;
  const poolTooLow =
    gamePoolBalance !== null &&
    gamePoolBalance !== 'N/A' &&
    betNum > 0 &&
    parseFloat(gamePoolBalance) < betNum * 2;

  // Link kontrak (opsional)
  const onOpenExplorer = () => {
    if (!explorerUrl || !contractAddress) {
      displayMessage?.('Explorer URL atau contract address belum di-set.', 'error', true);
      return;
    }
    window.open(`${explorerUrl}/address/${contractAddress}`, '_blank', 'noopener,noreferrer');
  };

  // Format helper untuk gas info
  const fmtGwei = (wei) => {
    try {
      return `${Number(wei) / 1e9} gwei`;
    } catch {
      return '—';
    }
  };
  const fmtCostMon = (wei) => {
    try {
      return `${Number(formatEther(wei)).toFixed(6)} MON`;
    } catch {
      return '—';
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="game-panel relative">
      {/* ===== Header Info (Wins/Losses + Contract link) ===== */}
      <motion.div
        variants={itemVariants}
        className="absolute top-4 right-4 bg-black/40 px-3 py-1 rounded-md border border-white/10 text-xs shadow-md flex items-center gap-2"
      >
        <span className="font-bold text-green-400">W: {wins}</span>
        <span className="text-gray-500">/</span>
        <span className="font-bold text-red-400">L: {losses}</span>
        <button
          onClick={onOpenExplorer}
          title="Open in Explorer"
          className="ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600"
        >
          Contract <FaExternalLinkAlt className="text-[9px]" />
        </button>
      </motion.div>

      {/* ===== Coin Portal ===== */}
      <motion.div variants={itemVariants} className="flex justify-center mb-6">
        <div className="coin-portal">
          <motion.div
            key={coinImage}
            className="w-full h-full rounded-full bg-contain bg-no-repeat bg-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            style={{ backgroundImage: `url(${coinImage})` }}
            variants={coinVariants}
            animate={isFlipping ? 'flipping' : 'idle'}
          />
        </div>
      </motion.div>

      {/* ===== Choice Buttons ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
        <button
          onClick={() => setChoice('head')}
          disabled={isFlipping}
          className={`btn-choice-3d ${choice === 'head' ? 'active' : ''}`}
          aria-pressed={choice === 'head'}
        >
          HEAD
        </button>
        <button
          onClick={() => setChoice('tail')}
          disabled={isFlipping}
          className={`btn-choice-3d ${choice === 'tail' ? 'active' : ''}`}
          aria-pressed={choice === 'tail'}
        >
          TAIL
        </button>
      </motion.div>

      {/* ===== Bet & Action ===== */}
      <motion.div variants={itemVariants} className="space-y-3">
        <label
          htmlFor="betAmount"
          className="block text-sm font-bold text-gray-400 mb-2 text-center tracking-widest"
        >
          SET YOUR BET
        </label>
        <div className="flex items-stretch gap-3">
          <input
            type="number"
            id="betAmount"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            disabled={isFlipping}
            className={`input-digital flex-grow ${betTooSmall ? 'ring-1 ring-red-500/60' : ''}`}
            placeholder="0.01"
            min="0"
            step="0.0001"
          />
          <button
            onClick={flipCoin}
            disabled={isFlipping || !isConnected || !choice || betTooSmall || poolTooLow}
            className="btn-action-3d !py-0 px-6 text-lg flex items-center justify-center gap-2"
            title={!isConnected ? 'Connect wallet' : !choice ? 'Choose HEAD or TAIL' : undefined}
          >
            {isFlipping ? (
              <>
                <FaSpinner className="animate-spin" /> FLIPPING
              </>
            ) : (
              'FLIP'
            )}
          </button>
        </div>

        {/* Quick bet */}
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

        {/* ===== Bottom info (sesuai permintaan) ===== */}
        <div className="mt-3 space-y-1.5 text-center text-[11px] text-gray-300/80">
          <div>
            Min bet <span className="font-semibold">0.01 MON</span>. Pool safety check: payout must be ≤ pool × 2.
          </div>
          <div>
            Pool:{' '}
            <span className="font-semibold text-emerald-400">
              {gamePoolBalance === null ? '—' : gamePoolBalance === 'N/A' ? 'N/A' : `${gamePoolBalance} MON`}
            </span>
          </div>
          <div className="text-[10px] text-gray-400">
            {(() => {
              const est = gasStats?.estimated ? gasStats.estimated.toString() : '—';
              const lim = gasStats?.limit ? gasStats.limit.toString() : '—';
              const used = gasStats?.used ? gasStats.used.toString() : '—';
              const price = gasStats?.price ? fmtGwei(gasStats.price) : '—';
              const estCost = gasStats?.estCost ? fmtCostMon(gasStats.estCost) : '—';
              const actCost = gasStats?.actualCost ? fmtCostMon(gasStats.actualCost) : null;
              return (
                <>
                  Gas (flip tx): est {est} / limit {lim} / used {used} • price {price} • cost est {estCost}
                  {actCost ? ` • cost actual ${actCost}` : ''}
                </>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* ===== Result Banner ===== */}
      <motion.div variants={itemVariants} className="h-14 flex items-center justify-center mt-6">
        <div
          className={`w-full text-center font-semibold p-3 rounded-lg border transition-all duration-300 ${getResultClasses()}`}
          role="status"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.span key={result || 'initial'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {result}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlaySection;
