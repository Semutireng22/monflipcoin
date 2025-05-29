import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaRedoAlt } from 'react-icons/fa'; // FaCoins untuk ikon bet, FaRedoAlt untuk tombol flip

const PlaySection = ({
  isConnected,
  coinResult, // 'head', 'tail', atau null/undefined
  choice,
  setChoice,
  bet,
  setBet,
  flipCoin,
  result, // Pesan dari App.jsx
  resultType, // Tipe pesan dari App.jsx
  displayMessage, // Fungsi untuk menampilkan pesan dari PlaySection
  isFlipping,
  gamePoolBalance,
  explorerUrl,
  contractAddress,
  theme // Menerima theme prop
}) => {
  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-color-text-placeholder dark:text-dark-text-placeholder text-lg py-10 px-4"
      >
        Please connect your wallet to start playing.
      </motion.div>
    );
  }

  // Kelas untuk pesan hasil, disesuaikan dengan tema baru
  let resultMessageClasses = "mt-6 text-center font-semibold p-3 rounded-lg shadow-md w-full max-w-md mx-auto break-words min-h-[3.5em] flex items-center justify-center text-sm sm:text-base transition-all duration-300 ease-in-out ";
  if (resultType === 'success') {
    resultMessageClasses += "bg-green-500 text-white dark:bg-green-600 dark:text-white animate-win-new"; // Warna sukses baru
  } else if (resultType === 'lose') {
    resultMessageClasses += "bg-red-500 text-white dark:bg-red-600 dark:text-white animate-lose-new"; // Warna kalah baru
  } else if (resultType === 'error') {
    resultMessageClasses += "bg-red-500 text-white dark:bg-red-700 dark:text-white animate-lose-new"; // Warna error baru
  } else if (resultType === 'processing') {
    resultMessageClasses += "bg-blue-500 text-white dark:bg-blue-600 dark:text-white border border-blue-300 dark:border-blue-700"; // Warna proses baru
  } else if (result) { // Pesan info umum
     resultMessageClasses += "bg-gray-200 text-gray-700 dark:bg-dark-elevation-2 dark:text-dark-text-secondary border border-gray-300 dark:border-dark-border";
  } else { // Tidak ada pesan, sembunyikan
      resultMessageClasses += "opacity-0 pointer-events-none";
  }

  const coinImageSrc = () => {
    if (isFlipping) return theme === 'dark' ? '/coin-flipping-dark.svg' : '/coin-flipping-light.svg'; // Animasi SVG saat flipping
    if (coinResult === 'head') return theme === 'dark' ? '/coin-head-dark.svg' : '/coin-head-light.svg';
    if (coinResult === 'tail') return theme === 'dark' ? '/coin-tail-dark.svg' : '/coin-tail-light.svg';
    return theme === 'dark' ? '/coin-default-dark.svg' : '/coin-default-light.svg'; // Koin default
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 sm:p-8 rounded-xl shadow-card-light dark:shadow-card-dark w-full max-w-lg flex flex-col items-center gap-6 sm:gap-8 bg-light-container-bg dark:bg-dark-container-bg"
    >
      {/* Game Pool Balance - Sesuai desain baru */}
      {gamePoolBalance !== null && (
        <div className="w-full text-center mb-2">
          <p className="text-sm text-color-text-secondary dark:text-dark-text-secondary">
            Game Pool: <span className="font-bold text-brand-gold">{parseFloat(gamePoolBalance).toFixed(2)} MON</span>
          </p>
          {contractAddress && explorerUrl && (
            <a 
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-blue hover:text-brand-blue-dark dark:text-brand-blue-light dark:hover:text-brand-blue-lighter underline transition-colors"
            >
              View Contract
            </a>
          )}
        </div>
      )}

      {/* Gambar Koin */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center bg-light-main-bg dark:bg-dark-main-bg shadow-interactive-light dark:shadow-interactive-dark p-2 transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.img
            key={coinImageSrc()} // Key penting untuk AnimatePresence bekerja dengan benar saat src berubah
            src={coinImageSrc()}
            alt={isFlipping ? "Coin flipping" : coinResult ? `Coin landed on ${coinResult}` : "Moneta Coin"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full object-contain ${!isFlipping && coinResult ? 'animate-coin-land' : ''}`}
          />
        </AnimatePresence>
      </div>

      {/* Tombol Pilihan HEAD/TAIL */}
      {/* Tombol Pilihan HEAD/TAIL - Desain Baru */}
      <div className="flex gap-4 sm:gap-6 w-full justify-center">
        {['head', 'tail'].map((option) => (
          <button
            key={option}
            className={`w-1/2 max-w-[180px] py-3 px-4 rounded-lg text-lg sm:text-xl font-bold uppercase transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-container-bg
              ${choice === option
                ? 'bg-brand-gold text-dark-main-bg shadow-interactive-strong-light dark:shadow-interactive-strong-dark ring-brand-gold-darker dark:ring-brand-gold-lighter'
                : 'bg-light-elevation-1 dark:bg-dark-elevation-1 text-color-text-secondary dark:text-dark-text-secondary hover:bg-light-elevation-2 dark:hover:bg-dark-elevation-2 hover:text-brand-gold dark:hover:text-brand-gold shadow-interactive-light dark:shadow-interactive-dark hover:shadow-interactive-hover-light dark:hover:shadow-interactive-hover-dark'}
              ${isFlipping ? 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100' : 'hover:scale-105 active:scale-95'}`}
            onClick={() => !isFlipping && setChoice(option)}
            disabled={isFlipping}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Input Bet dan Tombol FLIP */}
      {/* Input Bet dan Tombol FLIP - Desain Baru */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 w-full max-w-md">
        <div className="relative w-full sm:w-auto flex-grow">
          <label htmlFor="betAmount" className="block text-xs text-color-text-placeholder dark:text-dark-text-placeholder mb-1 ml-1 font-medium">Bet Amount (MON)</label>
          <div className="relative flex items-center">
            <FaCoins className="absolute left-3 top-1/2 -translate-y-1/2 text-color-text-placeholder dark:text-dark-text-placeholder" />
            <input
              id="betAmount"
              type="number"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              placeholder="0.01"
              className="pl-10 pr-3 py-3 w-full rounded-lg text-center font-semibold bg-light-main-bg dark:bg-dark-main-bg text-color-text-primary dark:text-dark-text-primary border border-light-border dark:border-dark-border focus:ring-2 focus:ring-brand-blue dark:focus:ring-brand-gold focus:border-transparent outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed h-full shadow-sm focus:shadow-md"
              disabled={!isConnected || !choice || isFlipping}
              step="0.01"
              min="0.01"
              max="1000" // Pertimbangkan untuk mengambil max bet dari kontrak jika ada
            />
          </div>
        </div>
        <button
          onClick={flipCoin}
          className={`w-full sm:w-auto mt-2 sm:mt-0 sm:self-end px-8 py-3.5 rounded-lg text-lg sm:text-xl font-bold uppercase shadow-interactive-light dark:shadow-interactive-dark transition-all duration-300 transform hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-container-bg
            ${isFlipping || !isConnected || !choice
              ? 'bg-gray-400 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-brand-gold text-dark-main-bg hover:bg-brand-gold-darker active:bg-brand-gold-darkest shadow-interactive-strong-light dark:shadow-interactive-strong-dark focus:ring-brand-gold-darker dark:focus:ring-brand-gold-lighter'}`}
          disabled={!isConnected || !choice || isFlipping}
        >
          {isFlipping ? (
            <>
              <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Flipping...
            </>
          ) : (
            <>
              <FaRedoAlt /> FLIP NOW!
            </>
          )}
        </button>
      </div>

      {/* Pesan Hasil - Menggunakan kelas yang sudah didefinisikan */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={resultMessageClasses}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>
      {!result && <div className="min-h-[3.5em]"></div>} {/* Placeholder untuk menjaga layout saat tidak ada pesan */}
    </motion.div>
  );
};

export default PlaySection;