import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Import default CSS dari Vite
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { monadTestnet } from '@reown/appkit/networks'; // Impor monadTestnet dari library

// 1. Project ID dari Reown Cloud
const projectId = 'b56e18d47c72ab683b10814fe9495694'; // Ganti dengan projectId dari https://cloud.reown.com

// 2. Set jaringan
const networks = [monadTestnet];

// 3. Metadata
const metadata = {
  name: 'MON Flipcoin - Blockchain Game on Monad Testnet',
  description: 'Play MON Flipcoin on Monad Testnet, choose Head or Tail, and win MON with a fair and secure gaming experience.',
  url: 'https://monflipcoin.vercel.app/', // Sesuaikan dengan domain saat deploy
  icons: ['https://i.ibb.co.com/xtrMr8pf/coin.png'], // Ganti dengan ikonmu
};

// 4. Buat instance AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Opsional
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);