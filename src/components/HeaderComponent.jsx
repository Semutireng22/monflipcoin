import React from 'react';
import { FaWallet, FaSignOutAlt, FaCopy, FaSun, FaMoon, FaPlay, FaHistory } from 'react-icons/fa';

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

  const NavButton = ({ tabName, children, icon: IconComponent }) => (
    <button
      onClick={() => setActiveTab(tabName.toLowerCase())}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out group
        ${activeTab === tabName.toLowerCase()
          ? 'bg-brand-gold text-dark-main-bg shadow-interactive hover:shadow-interactive-hover'
          : 'text-dark-text-secondary hover:text-brand-gold hover:bg-dark-main-bg/30 dark:hover:bg-dark-container-bg/60'
        }`}
    >
      {IconComponent && <IconComponent className="mr-2 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110" />}
      {children}
    </button>
  );

  return (
    <header className="w-full bg-dark-container-bg dark:bg-dark-container-bg shadow-subtle py-3 px-4 sm:px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Kiri: Logo/Nama Game */} 
        <div className="text-xl sm:text-2xl font-bold text-brand-gold tracking-wider cursor-default">
          MON FLIPCOIN
        </div>

        {/* Tengah: Navigasi Tabs (jika terhubung) - Lebih menonjol di tengah untuk desktop */} 
        {isConnected && (
          <nav className="hidden sm:flex items-center gap-2">
            <NavButton tabName="play" icon={FaPlay}>PLAY</NavButton>
            <NavButton tabName="history" icon={FaHistory}>HISTORY</NavButton>
          </nav>
        )}

        {/* Kanan: Kontrol (Toggle Tema & Wallet) */} 
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-dark-text-placeholder hover:text-brand-gold hover:bg-dark-main-bg/50 dark:hover:bg-dark-container-bg/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-opacity-50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FaSun size="1.1em" /> : <FaMoon size="1.1em" />}
          </button>

          <div className="min-w-[130px] flex justify-end">
            {!isConnected ? (
              <button
                onClick={openConnectModal}
                className="flex items-center justify-center gap-2 bg-brand-gold text-dark-main-bg font-semibold px-4 py-2 rounded-md shadow-interactive hover:shadow-interactive-hover hover:opacity-95 transition-all duration-200 transform active:scale-95 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-opacity-75"
              >
                <FaWallet className="h-4 w-4"/> Connect
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-dark-main-bg dark:bg-dark-main-bg/70 text-dark-text-secondary font-medium px-3 py-2 rounded-md shadow-sm text-xs sm:text-sm">
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...'}</span>
                <button onClick={copyAddress} className="p-1 rounded-full hover:bg-dark-container-bg dark:hover:bg-dark-container-bg/70 hover:text-brand-gold transition-colors duration-150" title="Copy address">
                  <FaCopy size="0.9em" />
                </button>
                <button onClick={handleDisconnect} className="p-1 rounded-full hover:bg-dark-container-bg dark:hover:bg-dark-container-bg/70 hover:text-brand-gold transition-colors duration-150" title="Disconnect wallet">
                  <FaSignOutAlt size="1em" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigasi Tabs di bawah Header untuk mobile (jika terhubung) */} 
      {isConnected && (
        <nav className="sm:hidden flex items-center justify-center gap-3 pt-3 border-t border-dark-main-bg/30 dark:border-dark-main-bg/50 mt-3">
          <NavButton tabName="play" icon={FaPlay}>PLAY</NavButton>
          <NavButton tabName="history" icon={FaHistory}>HISTORY</NavButton>
        </nav>
      )}
    </header>
  );
};

export default HeaderComponent;