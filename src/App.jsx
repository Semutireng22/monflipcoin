import { useState, useEffect, useRef } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import {
  useAppKit,
  useAppKitProvider,
  useAppKitAccount,
  useAppKitNetwork,
  useDisconnect,
} from '@reown/appkit/react';
import { monadTestnet } from '@reown/appkit/networks';

import { contractAddress, explorerUrl } from './config';
import contractAbi from './contractAbi.json';
import './index.css';

import HeaderComponent from './components/HeaderComponent';
import PlaySection from './components/PlaySection';
import HistorySection from './components/HistorySection';
import FooterComponent from './components/FooterComponent';

function App() {
  // ====== UI State ======
  const [choice, setChoice] = useState(null); // 'head' | 'tail' | null
  const [bet, setBet] = useState('0.01');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState('info'); // 'info' | 'success' | 'lose' | 'error' | 'processing'
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
  const [coinResult, setCoinResult] = useState(null); // 'head' | 'tail' | null
  const [isFlipping, setIsFlipping] = useState(false);

  // ====== Player Stats (local) ======
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // ====== Wallet / Network ======
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' });
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  // ====== Ethers refs ======
  const providerRef = useRef(null);
  const contractRef = useRef(null);

  // ====== Effects: theme ======
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

  // ====== Effects: history persist ======
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monFlipHistory', JSON.stringify(history));
    }
  }, [history]);

  // ====== Effects: load stats ======
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWins = localStorage.getItem('monFlipWins');
      const savedLosses = localStorage.getItem('monFlipLosses');
      if (savedWins) setWins(parseInt(savedWins, 10));
      if (savedLosses) setLosses(parseInt(savedLosses, 10));
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monFlipWins', wins.toString());
      localStorage.setItem('monFlipLosses', losses.toString());
    }
  }, [wins, losses]);

  // ====== Helper: show banner message ======
  const displayMessage = (message, type = 'info', temporary = false, duration = 5000) => {
    setResult(message);
    setResultType(type);
    if (temporary) {
      const timeoutId = setTimeout(() => {
        setResult((prev) => {
          if (prev === message) {
            setResultType('info');
            return '';
          }
          return prev;
        });
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  };

  // ====== Prepare provider+contract & fetch pool ======
  useEffect(() => {
    const setup = async () => {
      if (!isConnected || !walletProvider || chainId !== monadTestnet.id) {
        setGamePoolBalance(null);
        contractRef.current = null;
        providerRef.current = null;
        return;
      }
      try {
        const ethersProvider = new BrowserProvider(walletProvider);
        providerRef.current = ethersProvider;

        // read-only instance for reads
        const roContract = new Contract(contractAddress, contractAbi, ethersProvider);
        contractRef.current = roContract;

        const gamePoolWei = await roContract.gamePool();
        setGamePoolBalance(parseFloat(formatEther(gamePoolWei)).toFixed(4));
      } catch (err) {
        console.error('Error setting up provider/contract:', err);
        setGamePoolBalance('N/A');
      }
    };
    setup();
  }, [isConnected, walletProvider, chainId, isFlipping]);

  // ====== Cleanup listeners on unmount / key changes ======
  useEffect(() => {
    return () => {
      try {
        contractRef.current?.removeAllListeners?.('FlipResult');
      } catch {}
    };
  }, [address, chainId]);

  // ====== Actions ======
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
    if (isNaN(betAmount) || betAmount < 0.01 || betAmount > 1000) {
      displayMessage('Enter a valid bet amount (0.01 - 1000 MON)!', 'error', true, 3000);
      return;
    }
    if (
      gamePoolBalance !== null &&
      gamePoolBalance !== 'N/A' &&
      parseFloat(gamePoolBalance) < betAmount * 2
    ) {
      displayMessage('Game pool balance is too low for this bet. Contact admin.', 'error', true);
      return;
    }

    setIsFlipping(true);
    displayMessage('Flip submitted. Waiting VRF randomness...', 'processing');
    setCoinResult(null);

    try {
      // connect with signer for write
      const provider = providerRef.current ?? new BrowserProvider(walletProvider);
      providerRef.current = provider;
      const signer = await provider.getSigner();

      // ensure contractRef is signer-connected for .on() to work in same object
      const writeContract = new Contract(contractAddress, contractAbi, signer);
      contractRef.current = writeContract;

      // remember the current block to ignore old events
      const startBlock = await provider.getBlockNumber();

      // submit tx
      const betWei = parseEther(bet.toString());
      const tx = await writeContract.flipCoin(choice === 'head' ? 0 : 1, {
        value: betWei,
        gasLimit: 150000,
      });
      const submitHash = tx.hash;

      // wait mined (optional)
      await tx.wait();
      displayMessage('Waiting randomness (VRF)...', 'processing');

      let resolved = false;
      const me = (address || '').toLowerCase();

      const onFlipResult = (player, playerChoice, resultBool, won, amountBN, betBN, requestId, event) => {
        try {
          // filter by player & block
          if (!player || player.toLowerCase() !== me) return;
          const blk = event?.log?.blockNumber ?? 0;
          if (blk < startBlock) return;
          if (resolved) return;
          resolved = true;

          // stop listening for this round
          writeContract.off('FlipResult', onFlipResult);

          // parse values
          const amount = amountBN?.toString?.() ?? '0';
          const amountMon = parseFloat(formatEther(amount));
          const actualCoinSide = resultBool ? 'head' : 'tail';
          setCoinResult(actualCoinSide);

          if (won) setWins((p) => p + 1);
          else setLosses((p) => p + 1);

          const resultText = won
            ? `You Won! +${amountMon.toFixed(4)} MON`
            : `You Lost! -${betAmount.toFixed(4)} MON`;
          displayMessage(resultText, won ? 'success' : 'lose', true, 7000);

          const callbackTx = event?.log?.transactionHash ?? submitHash;
          const timestamp = new Date().toLocaleString();
          const historyEntry = {
            timestamp,
            txHash: callbackTx,
            choice,
            won,
            amount: won ? `+${amountMon.toFixed(4)} MON` : `-${betAmount.toFixed(4)} MON`,
            coinResult: actualCoinSide,
          };
          setHistory((prev) => [historyEntry, ...prev.slice(0, 49)]);
          setChoice(null);
        } finally {
          setIsFlipping(false);
        }
      };

      // listen for only this user's result
      writeContract.on('FlipResult', onFlipResult);

      // give user info if callback is slow
      setTimeout(() => {
        if (!resolved) {
          displayMessage(
            'Still waiting VRF callback... you can check the transaction on explorer.',
            'processing',
            true,
            8000
          );
        }
      }, 120000);
    } catch (error) {
      console.error('Error during flipCoin:', error);
      let userMessage = 'Transaction Failed. Please try again or check Explorer.';
      if (error?.reason) {
        userMessage = error.reason;
      } else if (error?.message) {
        if (error.message.includes('Insufficient game pool')) {
          userMessage = 'Game pool balance is too low. Contact admin.';
        } else if (error.message.includes('overflow')) {
          userMessage = 'Mathematical error (overflow). Check bet amount.';
        } else if (error.message.includes('reverted')) {
          userMessage = 'Transaction reverted by the contract.';
        }
      }
      displayMessage(userMessage, 'error', true);
      setIsFlipping(false);
      try {
        contractRef.current?.removeAllListeners?.('FlipResult');
      } catch {}
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
    try {
      contractRef.current?.removeAllListeners?.('FlipResult');
    } catch {}
  };

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));

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
            wins={wins}
            losses={losses}
          />
        )}

        {activeTab === 'history' && (
          <HistorySection history={history} explorerUrl={explorerUrl} theme={theme} />
        )}
      </main>

      <FooterComponent />
    </div>
  );
}

export default App;
