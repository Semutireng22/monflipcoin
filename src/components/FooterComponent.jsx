import React from 'react';
import { FaGithub, FaTwitter, FaHeart } from 'react-icons/fa';

const FooterComponent = ({ contractAddress }) => { // Menerima contractAddress dari App.jsx
  // contractAddressForDonation sekarang adalah contractAddress dari game, atau bisa juga alamat donasi terpisah jika diinginkan.
  // Untuk contoh ini, kita akan asumsikan donasi ke alamat kontrak game.
  const explorerBaseUrl = 'https://testnet.monadexplorer.com'; // Ini bisa juga di-pass sebagai prop jika berbeda per environment

  return (
    <footer className="py-6 px-4 w-full text-center bg-light-main-bg dark:bg-dark-main-bg border-t border-light-border dark:border-dark-border mt-auto transition-colors duration-300">
      <div className="text-xs sm:text-sm text-color-text-secondary dark:text-dark-text-secondary flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2 flex-wrap">
        <span>© {new Date().getFullYear()} MonetaFlip by</span>
        <a href="https://github.com/Semutireng" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-color-text-primary dark:text-dark-text-primary hover:text-brand-gold dark:hover:text-brand-gold transition-colors">
          <FaGithub /> Semutireng
        </a>
        <span>&</span>
        <a href="https://twitter.com/caridipesbuk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-color-text-primary dark:text-dark-text-primary hover:text-brand-gold dark:hover:text-brand-gold transition-colors">
          <FaTwitter /> caridipesbuk
        </a>
        <span className="hidden sm:inline">. All rights reserved.</span>
        {contractAddress && (
          <a 
            href={`${explorerBaseUrl}/address/${contractAddress}`}
            target="_blank" 
            rel="noopener noreferrer" 
            title="View game contract or donate to the pool" 
            className="inline-flex items-center gap-1.5 text-brand-blue hover:text-brand-blue-dark dark:text-brand-blue-light dark:hover:text-brand-blue-lighter hover:underline transition-colors"
          >
            <FaHeart className="text-red-500" /> View Contract / Donate
          </a>
        )}
      </div>
    </footer>
  );
};

export default FooterComponent;