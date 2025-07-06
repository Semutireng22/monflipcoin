import React from 'react';
import { FaWallet, FaSignOutAlt, FaCopy, FaSun, FaMoon, FaPlay, FaHistory } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const HeaderComponent = ({
  theme,
  toggleTheme,
  isConnected,
  address,
  openConnectModal,
  handleDisconnect,
  activeTab,
  setActiveTab,
  displayMessage
}) => {
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      if (displayMessage) {
        displayMessage("Address copied to clipboard!", "success", true, 2000);
      }
    }
  };

  // Komponen NavButton yang didesain ulang dengan efek 'glow' modern
  const NavButton = ({ tabName, children, icon: IconComponent }) => (
    <button
      onClick={() => setActiveTab(tabName.toLowerCase())}
      className="relative flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-300 group focus:outline-none"
    >
      <AnimatePresence>
        {activeTab === tabName.toLowerCase() && (
          // Efek 'glow' untuk tab yang aktif menggunakan Framer Motion
          <motion.span
            layoutId="activePill" // ID unik untuk animasi antar tombol
            className="absolute inset-0 bg-brand-gold rounded-md shadow-lg shadow-brand-gold/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            style={{ zIndex: 0 }}
          />
        )}
      </AnimatePresence>
      <span className={`relative flex items-center transition-colors ${activeTab === tabName.toLowerCase() ? 'text-black' : 'text-gray-300 group-hover:text-white'}`}>
        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
        {children}
      </span>
    </button>
  );

  return (
    // Header dengan efek "Frosted Glass" dan border halus
    <header className="w-full bg-black/40 backdrop-blur-xl border-b border-white/10 py-3 px-4 sm:px-6 sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center gap-4">
        
        {/* Kiri: Logo dengan efek gradien emas dan bayangan teks */}
        <div 
          className="text-xl sm:text-2xl font-bold tracking-wider cursor-default bg-gradient-to-r from-yellow-300 via-brand-gold to-amber-500 bg-clip-text text-transparent"
          style={{ textShadow: '0 2px 5px var(--color-glow-gold)' }}
        >
          MON FLIP
        </div>

        {/* Tengah: Navigasi Tabs dengan gaya 'Pill' (kapsul) */}
        {isConnected && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
            <nav className="flex items-center gap-2 bg-black/30 p-1 rounded-lg border border-white/10">
              <NavButton tabName="play" icon={FaPlay}>PLAY</NavButton>
              <NavButton tabName="history" icon={FaHistory}>HISTORY</NavButton>
            </nav>
          </div>
        )}

        {/* Kanan: Kontrol (Toggle Tema & Wallet) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-gray-400 hover:text-brand-gold bg-black/30 hover:bg-black/50 border border-transparent hover:border-white/10 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FaSun size="1.1em" /> : <FaMoon size="1.1em" />}
          </button>

          <div className="flex justify-end">
            {!isConnected ? (
              // Tombol Connect menggunakan gaya .btn-action-3d dari CSS
              <button
                onClick={openConnectModal}
                className="btn-action-3d text-sm py-2 px-4"
              >
                <FaWallet className="mr-2 h-4 w-4"/> Connect
              </button>
            ) : (
              // Tampilan alamat terhubung dengan gaya panel metalik
              <div className="flex items-center gap-2 bg-black/30 border border-white/10 text-gray-300 font-medium px-3 py-2 rounded-lg text-xs sm:text-sm">
                <span className="font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</span>
                <button onClick={copyAddress} className="p-1 rounded-full text-gray-400 hover:text-brand-gold transition-colors" title="Copy address">
                  <FaCopy size="0.9em" />
                </button>
                <button onClick={handleDisconnect} className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors" title="Disconnect wallet">
                  <FaSignOutAlt size="1em" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigasi Mobile dengan gaya yang diperbarui */}
      {isConnected && (
        <nav className="sm:hidden flex items-center justify-center gap-2 pt-3 border-t border-white/10 mt-3 bg-black/30 p-1 rounded-lg">
          <NavButton tabName="play" icon={FaPlay}>PLAY</NavButton>
          <NavButton tabName="history" icon={FaHistory}>HISTORY</NavButton>
        </nav>
      )}
    </header>
  );
};

export default HeaderComponent;