import React from 'react';

import { motion } from 'framer-motion';

const HistorySection = ({ history, explorerUrl, theme }) => {
  if (history.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center text-color-text-placeholder dark:text-dark-text-placeholder text-lg py-10 px-4"
      >
        No game history yet. Play a game!
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="p-6 sm:p-8 rounded-xl shadow-card-light dark:shadow-card-dark w-full max-w-2xl lg:max-w-3xl bg-light-container-bg dark:bg-dark-container-bg"
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-brand-gold mb-6 text-center">Game History</h2>
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar-themed"> {/* Menggunakan custom-scrollbar-themed dari index.css */}
        {history.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`p-4 rounded-lg shadow-interactive-light dark:shadow-interactive-dark transition-all duration-300 hover:shadow-interactive-hover-light dark:hover:shadow-interactive-hover-dark bg-light-elevation-1 dark:bg-dark-elevation-1 border-l-4 ${entry.won ? 'border-green-500 dark:border-green-400' : 'border-red-500 dark:border-red-400'}`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-2 border-b border-light-border dark:border-dark-border gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-color-text-secondary dark:text-dark-text-secondary">{entry.timestamp}</span>
              <span className={`text-sm sm:text-base font-semibold text-right whitespace-nowrap
                ${entry.won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {entry.choice.toUpperCase()} (Flip: {entry.coinResult.toUpperCase()}) - {entry.won ? 'WIN' : 'LOSE'} {entry.amount} MON
              </span>
            </div>
            <div className="text-xs sm:text-sm">
              <p className="text-color-text-secondary dark:text-dark-text-secondary break-all">
                <strong>Tx:</strong>{' '}
                <a
                  href={`${explorerUrl}/tx/${entry.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View transaction ${entry.txHash} on explorer`}
                  className="text-brand-blue hover:text-brand-blue-dark dark:text-brand-blue-light dark:hover:text-brand-blue-lighter hover:underline transition-colors"
                >
                  {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)}
                </a>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default HistorySection;