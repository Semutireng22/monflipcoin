import React from 'react';
// Impor dari config Anda
import { contractAddress, explorerUrl } from '../config';
import { FaGithub, FaTwitter, FaTelegram } from 'react-icons/fa';
import { motion } from 'framer-motion';

const FooterComponent = () => {
  const socialLinks = [
    { icon: FaGithub, href: 'https://github.com/semutireng22', name: 'GitHub' },
    { icon: FaTwitter, href: 'https://x.com/caridipesbuk', name: 'Twitter' },
    { icon: FaTelegram, href: 'https://t.me/jodohsaya', name: 'Telegram' },
  ];

  return (
    // Footer dengan gaya semi-transparan yang konsisten dengan Header
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-black/20 border-t border-white/10 text-center p-6 mt-16"
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Ikon Sosial dengan efek hover yang lebih menarik */}
        <div className="flex justify-center items-center space-x-6 mb-5">
          {socialLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label={link.name}
              className="text-gray-500 hover:text-brand-gold transition-all duration-300 transform hover:-translate-y-1"
            >
              <link.icon size={24} />
            </a>
          ))}
        </div>
        
        {/* Tautan ke Kontrak & Pool */}
        <div className="flex justify-center items-center space-x-4 mb-5 text-sm text-gray-400">
          <a href={`${explorerUrl}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors hover:underline underline-offset-4">
            View Contract
          </a>
          <span className="text-gray-600">|</span>
          <a href={`${explorerUrl}/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors hover:underline underline-offset-4">
            Support the Pool
          </a>
        </div>

        {/* Copyright dengan highlight pada nama kreator */}
        <p className="text-xs text-gray-500">
          MON Flip Game © {new Date().getFullYear()} - Created by <a href="https://github.com/semutireng22" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-gold/80 hover:text-brand-gold">Semutireng22</a>
        </p>
      </div>
    </motion.footer>
  );
};

export default FooterComponent;