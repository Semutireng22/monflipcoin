import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Pastikan ini mengarah ke index.css yang berisi @tailwind directives
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { monadTestnet } from '@reown/appkit/networks';

//
const projectId = 'b56e18d47c72ab683b10814fe9495694';
const networks = [monadTestnet];
const metadata = {
  name: 'MON Flipcoin - Blockchain Game on Monad Testnet',
  description: 'Play MON Flipcoin on Monad Testnet, choose Head or Tail, and win MON with a fair and secure gaming experience.',
  url: 'https://monflipcoin.vercel.app/', // Sesuaikan dengan domain saat deploy
  icons: ['https://i.ibb.co.com/xtrMr8pf/coin.png'], // Ganti dengan ikonmu
};

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