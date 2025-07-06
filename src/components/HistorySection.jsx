import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExternalLinkAlt } from 'react-icons/fa';

const HistorySection = ({ history, explorerUrl, theme }) => {

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 }
  };

  // Komponen untuk state kosong yang lebih bergaya
  if (!history || history.length === 0) {
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
    // Menggunakan .game-panel untuk konsistensi
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="game-panel h-full"
    >
      {/* Judul dengan gaya yang sama seperti komponen lain */}
      <h2 
        className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-300 via-brand-gold to-amber-500 bg-clip-text text-transparent"
        style={{ textShadow: '0 2px 5px var(--color-glow-gold)' }}
      >
        Game History
      </h2>

      {/* Kontainer riwayat yang bisa di-scroll */}
      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 -mr-2">
        <AnimatePresence>
          {history.map((entry, index) => (
            <motion.div
              key={entry.txHash || index} // Gunakan txHash sebagai key yang unik
              variants={itemVariants}
              layout // Menambahkan animasi saat daftar berubah
              className={`relative p-4 rounded-lg border border-white/10 transition-all duration-300
                        bg-black/30 hover:bg-black/50 hover:border-white/20
                        ${entry.won ? 'shadow-green-500/20 hover:shadow-green-500/30' : 'shadow-red-500/20 hover:shadow-red-500/30'}`}
            >
              {/* Indikator Glow untuk Win/Loss */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${entry.won ? 'bg-green-400' : 'bg-red-500'} shadow-lg ${entry.won ? 'shadow-green-400/50' : 'shadow-red-500/50'}`}></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                {/* Info Pilihan & Hasil */}
                <div className="flex-grow font-semibold text-base">
                  <span>Choice: <span className="text-white">{entry.choice.toUpperCase()}</span></span>
                  <span className="text-gray-500 mx-2">|</span>
                  <span>Result: <span className="text-white">{entry.coinResult.toUpperCase()}</span></span>
                </div>
                {/* Info Bet & Status */}
                <div className={`font-bold text-lg text-right whitespace-nowrap ${entry.won ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.won ? '+' : '-'} {parseFloat(entry.bet).toFixed(2)} MON
                </div>
              </div>

              {/* Info Tambahan: Timestamp & Link Transaksi */}
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex justify-between items-center">
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                <a
                  href={`${explorerUrl}/tx/${entry.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View transaction on explorer"
                  className="flex items-center gap-1.5 hover:text-brand-gold transition-colors"
                >
                  View Tx <FaExternalLinkAlt size="0.75em" />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HistorySection;