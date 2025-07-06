import { useState, useEffect } from 'react';
// Menggunakan import asli dari proyek Anda
import { useAppKit, useAppKitProvider, useAppKitAccount, useAppKitNetwork, useDisconnect } from '@reown/appkit/react';
import { BrowserProvider, Contract, formatEther, parseEther, Interface } from 'ethers';
import { monadTestnet } from '@reown/appkit/networks';
// Impor dari file konfigurasi baru
import { contractAddress, explorerUrl } from './config'; 
import contractAbi from './contractAbi.json';
import './index.css';

import HeaderComponent from './components/HeaderComponent';
import PlaySection from './components/PlaySection';
import HistorySection from './components/HistorySection';
import FooterComponent from './components/FooterComponent';

function App() {
  // State asli Anda
  const [choice, setChoice] = useState(null);
  const [bet, setBet] = useState('0.01');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState('info');
  const [gamePoolBalance, setGamePoolBalance] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return ['light', 'dark'].includes(savedTheme) ? savedTheme : 'dark';
    }
    return 'dark';
  });
  const [activeTab, setActiveTab] = useState('play');
  const [history, setHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('monFlipHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });
  const [coinResult, setCoinResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // <-- PERUBAHAN BARU: State untuk statistik pemain -->
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // Hooks asli dari @reown/appkit/react
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount({ namespace: 'eip155' });
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();
  
  // <-- PERUBAHAN BARU: Memuat statistik dari localStorage -->
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedWins = localStorage.getItem('monFlipWins');
        const savedLosses = localStorage.getItem('monFlipLosses');
        if (savedWins) setWins(parseInt(savedWins, 10));
        if (savedLosses) setLosses(parseInt(savedLosses, 10));
    }
  }, []);

  // <-- PERUBAHAN BARU: Menyimpan statistik ke localStorage setiap kali ada perubahan -->
  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('monFlipWins', wins.toString());
        localStorage.setItem('monFlipLosses', losses.toString());
    }
  }, [wins, losses]);


  // Efek-efek lain dari kode asli Anda (tidak diubah)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monFlipHistory', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    const fetchGamePoolBalance = async () => {
      if (isConnected && walletProvider && chainId === monadTestnet.id) {
        try {
          const ethersProvider = new BrowserProvider(walletProvider);
          const contract = new Contract(contractAddress, contractAbi, ethersProvider);
          const gamePoolWei = await contract.gamePool();
          setGamePoolBalance(parseFloat(formatEther(gamePoolWei)).toFixed(4));
        } catch (error) {
          console.error('Error fetching game pool balance:', error);
          setGamePoolBalance('N/A');
        }
      } else {
        setGamePoolBalance(null);
      }
    };
    fetchGamePoolBalance();
  }, [isConnected, walletProvider, chainId, isFlipping]);

  const displayMessage = (message, type = 'info', temporary = false, duration = 5000) => {
    setResult(message);
    setResultType(type);
    if (temporary) {
      const timeoutId = setTimeout(() => {
        setResult(prevResult => {
          if (prevResult === message) {
            setResultType('info');
            return '';
          }
          return prevResult;
        });
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  };

  async function flipCoin() {
    if (!isConnected) {
      displayMessage('Please connect your wallet first!', 'error', true);
      return;
    }
    if (chainId !== monadTestnet.id) {
      displayMessage('Incorrect network! Please use Monad TestNet.', 'error', true);
      return;
    }
    if (!choice) {
      displayMessage('Please choose HEADS or TAILS!', 'error', true, 3000);
      return;
    }
    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > 1000) {
      displayMessage('Enter a valid bet amount (0.01 - 1000 MON)!', 'error', true, 3000);
      return;
    }
    if (gamePoolBalance !== null && gamePoolBalance !== 'N/A' && parseFloat(gamePoolBalance) < betAmount * 2) {
      displayMessage('Game pool balance is too low for this bet. Contact admin.', 'error', true);
      return;
    }

    setIsFlipping(true);
    displayMessage('Processing your flip...', 'processing');
    setCoinResult(null);

    try {
      const betWei = parseEther(bet.toString());
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(contractAddress, contractAbi, signer);

      const tx = await contract.flipCoin(choice === 'head' ? 0 : 1, { value: betWei, gasLimit: 150000 });
      const receipt = await tx.wait();

      let event;
      if (receipt.logs) {
        const iface = new Interface(contractAbi);
        for (const log of receipt.logs) {
          try {
            const parsedLog = iface.parseLog(log);
            if (parsedLog && parsedLog.name === 'FlipResult') {
              event = { args: parsedLog.args };
              break;
            }
          } catch (e) { /* ignore */ }
        }
      }

      if (!event) {
        console.warn('FlipResult event not found in receipt:', receipt);
        displayMessage('Warning: FlipResult event not found. Check explorer.', 'error');
        return;
      }

      const won = event.args.won;

      // <-- PERUBAHAN BARU: Memperbarui statistik -->
      if (won) {
        setWins(prev => prev + 1);
      } else {
        setLosses(prev => prev + 1);
      }

      const amount = event.args.amount.toString();
      const amountMon = parseFloat(formatEther(amount));
      const actualCoinSide = event.args.result ? 'head' : 'tail';

      setCoinResult(actualCoinSide);

      const resultText = won ? `You Won! +${amountMon.toFixed(4)} MON` : `You Lost! -${betAmount.toFixed(4)} MON`;
      displayMessage(resultText, won ? 'success' : 'lose', true, 7000);

      const timestamp = new Date().toLocaleString();
      const historyEntry = {
        timestamp,
        txHash: tx.hash,
        choice,
        won,
        amount: won ? `+${amountMon.toFixed(4)} MON` : `-${betAmount.toFixed(4)} MON`,
        coinResult: actualCoinSide,
      };
      setHistory((prev) => [historyEntry, ...prev.slice(0, 49)]);
      setChoice(null);

    } catch (error) {
      console.error('Error during flipCoin:', error);
      let userMessage = 'Transaction Failed. Please try again or check Explorer.';
      if (error.reason) {
        userMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('Insufficient game pool')) {
            userMessage = 'Game pool balance is too low. Contact admin.';
        } else if (error.message.includes('overflow')) {
            userMessage = 'Mathematical error (overflow). Check bet amount.';
        } else if (error.message.includes('reverted')) {
            userMessage = 'Transaction reverted by the contract.';
        }
      }
      displayMessage(userMessage, 'error', true);
    } finally {
      setIsFlipping(false);
    }
  }

  const openConnectModal = () => open({ view: 'Connect', namespace: 'eip155' });
  
  const handleDisconnect = async () => {
    await disconnect();
    displayMessage('', 'info');
    setBet('0.01');
    setChoice(null);
    setCoinResult(null);
    setIsFlipping(false);
  };
  
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <HeaderComponent
        theme={theme}
        toggleTheme={toggleTheme}
        isConnected={isConnected}
        address={address}
        openConnectModal={openConnectModal}
        handleDisconnect={handleDisconnect}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayMessage={displayMessage}
      />
      <main className="flex-grow container mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8 w-full">
        {activeTab === 'play' && (
          <PlaySection
            choice={choice}
            setChoice={setChoice}
            bet={bet}
            setBet={setBet}
            flipCoin={flipCoin}
            result={result}
            resultType={resultType}
            displayMessage={displayMessage}
            isConnected={isConnected}
            gamePoolBalance={gamePoolBalance}
            coinResult={coinResult}
            isFlipping={isFlipping}
            explorerUrl={explorerUrl}
            contractAddress={contractAddress}
            theme={theme}
            // <-- PERUBAHAN BARU: Mengirim props statistik -->
            wins={wins}
            losses={losses}
          />
        )}
        {activeTab === 'history' && (
          <HistorySection history={history} explorerUrl={explorerUrl} theme={theme} />
        )}
      </main>
      {/* Footer sekarang akan mengambil config sendiri */}
      <FooterComponent />
    </div>
  );
}

export default App;