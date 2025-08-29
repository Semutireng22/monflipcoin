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

// Gas floor lebih tinggi dari rekomendasi Pyth (500k)
const GAS_FLOOR = 650_000n;

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

  // ====== Gas Stats (ditampilkan di PlaySection) ======
  const [gasStats, setGasStats] = useState({
    estimated: null,     // bigint
    limit: null,         // bigint
    used: null,          // bigint
    price: null,         // bigint
    estCost: null,       // bigint (limit * maxFee)
    actualCost: null,    // bigint (used * effective)
    submitHash: null,    // hash tx submit flipCoin
    callbackHash: null,  // hash tx callback FlipResult
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

  // ====== Action: flipCoin (race-proof + GAS_FLOOR 650k) ======
  async function flipCoin() {
    if (!isConnected) return displayMessage('Please connect your wallet first!', 'error', true);
    if (chainId !== monadTestnet.id) return displayMessage('Incorrect network! Please use Monad TestNet.', 'error', true);
    if (!choice) return displayMessage('Please choose HEADS or TAILS!', 'error', true, 3000);

    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount < 0.01 || betAmount > 1000) {
      return displayMessage('Enter a valid bet amount (0.01 - 1000 MON)!', 'error', true, 3000);
    }
    if (
      gamePoolBalance !== null &&
      gamePoolBalance !== 'N/A' &&
      parseFloat(gamePoolBalance) < betAmount * 2
    ) {
      return displayMessage('Game pool balance is too low for this bet. Contact admin.', 'error', true);
    }

    setIsFlipping(true);
    setCoinResult(null);
    setGasStats((g) => ({ ...g, used: null, actualCost: null, callbackHash: null, submitHash: null }));
    displayMessage('Submitting flip...', 'processing');

    try {
      // signer for write
      const provider = providerRef.current ?? new BrowserProvider(walletProvider);
      providerRef.current = provider;
      const signer = await provider.getSigner();
      const writeContract = new Contract(contractAddress, contractAbi, signer);
      contractRef.current = writeContract;

      // 1) startBlock + pasang listener dulu (race-proof)
      const startBlock = await provider.getBlockNumber();
      let resolved = false;
      const me = (address || '').toLowerCase();

      const finish = (won, amountBN, resultBool, evTxHash) => {
        const amountMon = parseFloat(formatEther(amountBN?.toString?.() ?? '0'));
        const actualCoinSide = resultBool ? 'head' : 'tail';
        setCoinResult(actualCoinSide);
        won ? setWins((p) => p + 1) : setLosses((p) => p + 1);

        const txt = won
          ? `You Won! +${amountMon.toFixed(4)} MON`
          : `You Lost! -${betAmount.toFixed(4)} MON`;
        displayMessage(txt, won ? 'success' : 'lose', true, 7000);

        const timestamp = new Date().toLocaleString();
        setHistory((prev) => [
          {
            timestamp,
            txHash: evTxHash,
            choice,
            won,
            amount: won ? `+${amountMon.toFixed(4)} MON` : `-${betAmount.toFixed(4)} MON`,
            coinResult: actualCoinSide,
          },
          ...prev.slice(0, 49),
        ]);
        setGasStats((g) => ({ ...g, callbackHash: evTxHash }));
        setChoice(null);
        setIsFlipping(false);
      };

      const handler = (player, playerChoice, resultBool, won, amountBN, betBN, requestId, event) => {
        const blk = event?.log?.blockNumber ?? event?.blockNumber ?? 0;
        if (!player || player.toLowerCase() !== me) return;
        if (blk < startBlock) return;
        if (resolved) return;
        resolved = true;
        writeContract.off('FlipResult', handler);
        const evTxHash = event?.log?.transactionHash ?? event?.transactionHash;
        finish(won, amountBN, resultBool, evTxHash);
      };

      writeContract.on('FlipResult', handler);

      // 2) Estimate gas + buffer + floor
      const betWei = parseEther(bet.toString());
      let gasLimit, estimated;
      try {
        estimated = await writeContract.flipCoin.estimateGas(
          choice === 'head' ? 0 : 1,
          { value: betWei }
        );
        gasLimit = (estimated * 125n) / 100n; // +25%
        if (gasLimit < GAS_FLOOR) gasLimit = GAS_FLOOR;
      } catch (e) {
        console.warn('estimateGas failed, fallback to GAS_FLOOR:', e);
        estimated = null;
        gasLimit = GAS_FLOOR;
      }

      // 3) Estimasi biaya (untuk UI)
      const feeData = await provider.getFeeData();
      const maxFee = feeData.maxFeePerGas ?? feeData.gasPrice ?? null;
      const estCost = maxFee ? gasLimit * maxFee : null;
      setGasStats((g) => ({ ...g, estimated, limit: gasLimit, price: maxFee, estCost }));

      // 4) Submit tx → langsung status waiting VRF
      const tx = await writeContract.flipCoin(
        choice === 'head' ? 0 : 1,
        { value: betWei, gasLimit }
      );
      setGasStats((g) => ({ ...g, submitHash: tx.hash }));
      displayMessage('Waiting randomness (VRF)...', 'processing');

      // 5) Tunggu mined untuk isi gas used
      const submitRcpt = await tx.wait();
      const used = submitRcpt?.gasUsed ?? null;
      const effPrice = submitRcpt?.effectiveGasPrice ?? maxFee ?? null;
      const actualCost = used && effPrice ? used * effPrice : null;
      setGasStats((g) => ({ ...g, used, price: effPrice, actualCost }));

      // 6) Backfill query logs kalau event sudah lewat cepat
      try {
        if (!resolved) {
          const filter = writeContract.filters.FlipResult();
          const past = await writeContract.queryFilter(filter, startBlock, 'latest');
          for (const ev of past) {
            const [player, playerChoice, resultBool, won, amountBN] = ev.args || [];
            if (player && player.toLowerCase() === me) {
              if (!resolved) {
                resolved = true;
                writeContract.off('FlipResult', handler);
                finish(won, amountBN, resultBool, ev.transactionHash);
              }
              break;
            }
          }
        }
      } catch (bfErr) {
        console.warn('Backfill queryFilter failed:', bfErr);
      }

      // 7) Info kalau callback lambat
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
      let msg = 'Transaction Failed. Please try again or check Explorer.';
      const low = (error?.reason || error?.message || '').toLowerCase();
      if (low.includes('out of gas')) msg = 'Out of gas. Gas limit raised; please try again.';
      displayMessage(msg, 'error', true);
      setIsFlipping(false);
      try { contractRef.current?.removeAllListeners?.('FlipResult'); } catch {}
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
