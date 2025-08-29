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

  // ====== Player Stats ======
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // ====== Gas Stats for UI ======
  const [gasStats, setGasStats] = useState({
    estimated: null,     // bigint
    limit: null,         // bigint
    used: null,          // bigint (actual from receipt)
    price: null,         // bigint (effective)
    estCost: null,       // bigint (limit * maxFeePerGas approx)
    actualCost: null,    // bigint (used * effectiveGasPrice)
    submitHash: null,    // tx hash of submit
    callbackHash: null,  // tx hash of callback (from event)
  });

  // ====== Wallet / Network ======
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' });
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  // ====== Ethers refs ======
  const providerRef = useRef(null);
  const contractRef = useRef(null);

  // ====== Theme ======
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

  // ====== History persist ======
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monFlipHistory', JSON.stringify(history));
    }
  }, [history]);

  // ====== Load stats ======
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

  // ====== Banner helper ======
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

        // read-only instance
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

  // ====== Cleanup listeners ======
  useEffect(() => {
    return () => {
      try {
        contractRef.current?.removeAllListeners?.('FlipResult');
      } catch {}
    };
  }, [address, chainId]);

  // ====== Action: flipCoin with gas handling ======
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
    setCoinResult(null);
    setGasStats((g) => ({ ...g, used: null, actualCost: null, callbackHash: null }));
    displayMessage('Flip submitted. Waiting VRF randomness...', 'processing');

    try {
      // signer for write
      const provider = providerRef.current ?? new BrowserProvider(walletProvider);
      providerRef.current = provider;
      const signer = await provider.getSigner();

      const writeContract = new Contract(contractAddress, contractAbi, signer);
      contractRef.current = writeContract;

      // ignore events older than current block
      const startBlock = await provider.getBlockNumber();

      // estimate gas + buffer + floor(500k)
      const betWei = parseEther(bet.toString());
      let gasLimit, estimated;
      try {
        estimated = await writeContract.flipCoin.estimateGas(
          choice === 'head' ? 0 : 1,
          { value: betWei }
        );
        gasLimit = (estimated * 125n) / 100n;        // +25% buffer
        if (gasLimit < 500000n) gasLimit = 500000n; // floor per rekomendasi Pyth (Monad)
      } catch (estErr) {
        console.warn('estimateGas failed, fallback to 500k:', estErr);
        estimated = null;
        gasLimit = 500000n;
      }

      // perkiraan biaya (pakai feeData)
      const feeData = await provider.getFeeData();
      const maxFee = feeData.maxFeePerGas ?? feeData.gasPrice; // bigint | null
      const estCost = maxFee && gasLimit ? (gasLimit * maxFee) : null;

      setGasStats((g) => ({
        ...g,
        estimated,
        limit: gasLimit,
        price: maxFee ?? null,
        estCost,
        submitHash: null,
      }));

      // submit
      const tx = await writeContract.flipCoin(
        choice === 'head' ? 0 : 1,
        { value: betWei, gasLimit }
      );
      const submitHash = tx.hash;

      setGasStats((g) => ({ ...g, submitHash }));

      // wait mined (submit tx)
      const submitRcpt = await tx.wait();

      // capture used gas/price from submit receipt (bisa undefined di sebagian provider, tapi coba ambil)
      const used = submitRcpt?.gasUsed ?? null;
      const effPrice = submitRcpt?.effectiveGasPrice ?? maxFee ?? null;
      const actualCost = used && effPrice ? (used * effPrice) : null;
      setGasStats((g) => ({
        ...g,
        used,
        price: effPrice,
        actualCost,
      }));

      displayMessage('Waiting randomness (VRF)...', 'processing');

      // wait for FlipResult (callback tx)
      let resolved = false;
      const me = (address || '').toLowerCase();

      const onFlipResult = (player, playerChoice, resultBool, won, amountBN, betBN, requestId, event) => {
        try {
          if (!player || player.toLowerCase() !== me) return;
          const blk = event?.log?.blockNumber ?? 0;
          if (blk < startBlock) return;
          if (resolved) return;
          resolved = true;

          writeContract.off('FlipResult', onFlipResult);

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

          setGasStats((g) => ({ ...g, callbackHash }));
        } finally {
          setIsFlipping(false);
        }
      };

      writeContract.on('FlipResult', onFlipResult);

      // info if callback slow
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
      const msg = (error?.reason || error?.message || '').toLowerCase();
      if (msg.includes('out of gas')) {
        userMessage = 'Out of gas. Gas limit increased — please try again.';
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
            // NEW: kirim gas info ke UI bawah
            gasStats={gasStats}
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
