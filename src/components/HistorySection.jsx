import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExternalLinkAlt } from 'react-icons/fa';

const STORAGE_PREFIX = 'monFlipHistory';

function keyFor(addr) {
  const a = (addr || '').toLowerCase();
  return `${STORAGE_PREFIX}:${a || 'unknown'}`;
}

function dedupeAndSort(entries) {
  const map = new Map();
  for (const e of entries || []) {
    const k = `${e.txHash || e.clientId || 'nohash'}:${e.timestamp || ''}`;
    if (!map.has(k)) map.set(k, e);
  }
  // terbaru di atas
  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    return tb - ta;
  }).slice(0, 200); // batas aman agar tak membengkak
}

function statusMeta(entry) {
  // normalisasi status
  // prioritas: entry.status -> won/lost -> pending -> failed
  let status = entry?.status;
  if (!status) {
    if (entry?.won === true) status = 'won';
    else if (entry?.won === false) status = 'lost';
    else status = 'pending';
  }
  status = String(status).toLowerCase();

  switch (status) {
    case 'won':
      return { label: 'WON', dot: 'bg-green-400', text: 'text-green-400', chip: 'bg-green-500/10 border-green-400/40' };
    case 'lost':
      return { label: 'LOST', dot: 'bg-red-500', text: 'text-red-400', chip: 'bg-red-500/10 border-red-400/40' };
    case 'failed':
      return { label: 'FAILED', dot: 'bg-rose-500', text: 'text-rose-300', chip: 'bg-rose-500/10 border-rose-400/40' };
    case 'pending':
    default:
      return { label: 'PENDING', dot: 'bg-amber-400', text: 'text-amber-300', chip: 'bg-amber-500/10 border-amber-400/40' };
  }
}

const HistorySection = ({ history, explorerUrl, theme, address }) => {
  const [localHistory, setLocalHistory] = useState([]);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.05 },
    },
  };

  const itemVariants = { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } };

  // Load dari localStorage saat address berubah
  useEffect(() => {
    const k = keyFor(address);
    try {
      const raw = localStorage.getItem(k);
      const saved = raw ? JSON.parse(raw) : [];
      setLocalHistory(dedupeAndSort(saved));
    } catch {
      setLocalHistory([]);
    }
  }, [address]);

  // Merge: prop `history` (dari App) -> simpan per-user
  useEffect(() => {
    if (!address) return;
    const k = keyFor(address);
    try {
      const raw = localStorage.getItem(k);
      const saved = raw ? JSON.parse(raw) : [];
      const merged = dedupeAndSort([...(history || []), ...saved]);
      localStorage.setItem(k, JSON.stringify(merged));
      setLocalHistory(merged);
    } catch (e) {
      console.warn('failed to persist history', e);
    }
  }, [history, address]);

  const shown = useMemo(() => dedupeAndSort(localHistory), [localHistory]);

  // Empty state
  if (!shown || shown.length === 0) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="game-panel text-center text-gray-500 py-20"
      >
        <h3 className="text-lg font-semibold">No History Found</h3>
        <p className="text-sm">Play a game to see your history here!</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="game-panel h-full">
      <h2
        className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-300 via-brand-gold to-amber-500 bg-clip-text text-transparent"
        style={{ textShadow: '0 2px 5px var(--color-glow-gold)' }}
      >
        Game History
      </h2>

      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 -mr-2">
        <AnimatePresence>
          {shown.map((entry, index) => {
            const meta = statusMeta(entry);
            const choice = (entry.choice || '').toString().toUpperCase();
            const coinResult = (entry.coinResult || (entry.result ? (entry.result ? 'HEAD' : 'TAIL') : '')).toString().toUpperCase();
            const timeText = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—';
            const amountText =
              entry.amount ??
              (typeof entry.bet === 'number' || typeof entry.bet === 'string'
                ? (entry.won ? `+${entry.bet}` : `-${entry.bet}`) + ' MON'
                : (entry.won === true ? '+? MON' : entry.won === false ? '-? MON' : '—'));
            const txHash = entry.txHash || entry.submitHash || ''; // fallback
            const shortHash = txHash ? `${txHash.slice(0, 8)}…${txHash.slice(-6)}` : '—';

            return (
              <motion.div
                key={txHash || entry.clientId || `${index}-${timeText}`}
                variants={itemVariants}
                layout
                className={`relative p-4 rounded-lg border transition-all duration-300
                  bg-black/30 hover:bg-black/50
                  ${meta.chip} hover:border-white/20`}
              >
                {/* Status dot + chip */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${meta.dot} shadow-lg`} />
                <div className="absolute top-2 left-2 text-[10px] px-2 py-[2px] rounded border border-white/10 bg-black/30">
                  <span className={`font-bold ${meta.text}`}>{meta.label}</span>
                </div>

                {/* Baris utama: Choice / Result / Amount */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-base">
                    <span>
                      Choice:{' '}
                      <span className="text-white">{choice || '—'}</span>
                    </span>
                    <span className="text-gray-500">|</span>
                    <span>
                      Result:{' '}
                      <span className="text-white">{coinResult || (meta.label === 'PENDING' ? '—' : '—')}</span>
                    </span>
                    {entry.requestId && (
                      <>
                        <span className="text-gray-500">|</span>
                        <span className="text-xs text-gray-400">Req: {entry.requestId.slice(0, 10)}…</span>
                      </>
                    )}
                  </div>

                  <div className={`font-bold text-lg text-right whitespace-nowrap ${meta.text}`}>
                    {amountText}
                  </div>
                </div>

                {/* Info tambahan: timestamp + tx link */}
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex flex-wrap gap-2 justify-between items-center">
                  <span>{timeText}</span>
                  {txHash ? (
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View transaction on explorer"
                      className="flex items-center gap-1.5 hover:text-brand-gold transition-colors"
                    >
                      {shortHash} <FaExternalLinkAlt size="0.75em" />
                    </a>
                  ) : (
                    <span className="italic">No tx hash yet</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HistorySection;
