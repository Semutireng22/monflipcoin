import { useState, useEffect } from 'react';
import { useAppKit, useAppKitProvider, useAppKitAccount, useAppKitNetwork, useDisconnect } from '@reown/appkit/react';
import { BrowserProvider, Contract, formatEther, parseEther, Interface } from 'ethers';
import { monadTestnet } from '@reown/appkit/networks';
import './App.css';
import { FaWallet, FaSignOutAlt } from 'react-icons/fa';

const contractAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "bet",
				"type": "uint256"
			}
		],
		"name": "BetPlaced",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "enum CoinflipGame.Choice",
				"name": "_choice",
				"type": "uint8"
			}
		],
		"name": "flipCoin",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum CoinflipGame.Choice",
				"name": "playerChoice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "result",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "won",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "bet",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "requestId",
				"type": "bytes32"
			}
		],
		"name": "FlipResult",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "fundGamePool",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "depositor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "toGamePool",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "toReserve",
				"type": "uint256"
			}
		],
		"name": "FundsDeposited",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "toGamePool",
				"type": "bool"
			}
		],
		"name": "FundsMoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsWithdrawn",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "moveFromGamePool",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "moveToGamePool",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawAllFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "contractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gamePool",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_BET",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contractAddress = '0x664e248c39cd70Fa333E9b2544beEd6A7a2De09b'; // Pastikan alamat ini sesuai
const explorerUrl = 'https://testnet.monadexplorer.com';

function App() {
  const [choice, setChoice] = useState(null);
  const [bet, setBet] = useState('0.01');
  const [result, setResult] = useState('');
  const [gamePoolBalance, setGamePoolBalance] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [activeTab, setActiveTab] = useState('play');
  const [history, setHistory] = useState([]);
  const [animationClass, setAnimationClass] = useState('');
  const [coinResult, setCoinResult] = useState(null);

  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount({ namespace: 'eip155' });
  const { walletProvider } = useAppKitProvider('eip155');
  const { caipNetwork, chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (isConnected && walletProvider) {
        try {
          const ethersProvider = new BrowserProvider(walletProvider);
          const contract = new Contract(contractAddress, contractAbi, ethersProvider);
          const gamePoolWei = await contract.gamePool();
          const contractBalanceWei = await contract.getContractBalance();
          const totalBalanceWei = await contract.getTotalBalance();
          setGamePoolBalance(parseFloat(formatEther(gamePoolWei)).toFixed(4));
        } catch (error) {
          console.error('Error fetching balances:', error);
          setGamePoolBalance('N/A');
        }
      } else {
        setGamePoolBalance(null);
      }
    };
    fetchBalances();
  }, [isConnected, walletProvider]);

  async function flipCoin() {
    if (!isConnected) {
      setResult('Please connect the wallet first!');
      return;
    }
    if (chainId !== monadTestnet.id) {
      setResult('False network!Use Monad TestNet.');
      return;
    }
    if (!choice) {
      setResult('Choose a head or tail!');
      return;
    }
    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > 1000) {
      setResult('Enter the valid amount of bet (maximum 1000 mon)!');
      return;
    }
    const betWei = parseEther(bet.toString());

    if (gamePoolBalance !== null && parseFloat(gamePoolBalance) < betAmount * 2) {
      setResult('Game pool balance is not enough to pay for victory.Please contact the admin to add funds.');
      return;
    }

    try {
      // Atur ulang state sebelum memulai bet baru
      setResult('Processing bet ...');
      setAnimationClass('');
      setCoinResult(null);

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(contractAddress, contractAbi, signer);

      // Panggil fungsi flipCoin
      const tx = await contract.flipCoin(choice === 'head' ? 0 : 1, { value: betWei, gasLimit: 150000 });
      console.log('Transaction sent, hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      // Coba cari event FlipResult langsung
      let event = receipt.events?.find((e) => e.event === 'FlipResult');

      // Jika event tidak ditemukan, parse log secara manual
      if (!event && receipt.logs) {
        const iface = new Interface(contractAbi);
        for (const log of receipt.logs) {
          try {
            const parsedLog = iface.parseLog(log);
            if (parsedLog && parsedLog.name === 'FlipResult') {
              event = {
                args: parsedLog.args,
              };
              break;
            }
          } catch (error) {
            console.warn('Failed to parse log:', log, error);
          }
        }
      }

      if (!event) {
        console.warn('FlipResult event not found in receipt:', receipt);
        setResult('Warning: Flipresult event is not found.Transactions may be successful, check explorer.');
        return;
      }

      // Proses event FlipResult
      const won = event.args.won;
      const amount = event.args.amount.toString();
      const amountMon = parseFloat(formatEther(amount));
      const resultText = won ? `Win! Rewards: +${amountMon.toFixed(4)} MON` : `Lose! Rewards: -${betAmount.toFixed(4)} MON`;
      setResult(resultText);
      setAnimationClass(won ? 'win-animation' : 'lose-animation');

      const coinOutcome = event.args.result ? 'head' : 'tail';
      setCoinResult(coinOutcome);

      const timestamp = new Date().toLocaleString();
      const historyEntry = {
        timestamp,
        txHash: tx.hash,
        choice,
        won,
        amount: won ? `+${amountMon.toFixed(4)} MON` : `-${betAmount.toFixed(4)} MON`,
        coinResult: coinOutcome,
      };
      setHistory((prev) => [historyEntry, ...prev]);
      setChoice(null);

      // Perbarui gamePoolBalance setelah transaksi
      const gamePoolWei = await contract.gamePool();
      setGamePoolBalance(parseFloat(formatEther(gamePoolWei)).toFixed(4));
    } catch (error) {
      console.error('Error during flipCoin:', error);
      if (error.reason === 'Insufficient game pool to pay winnings') {
        setResult('Game pool balance is not enough to pay for victory.Please contact the admin to add funds.');
      } else if (error.code === 'CALL_EXCEPTION' && error.data && error.data.includes('0x4e487b71')) {
        setResult('Mathematical errors occur (overflow).Please check the amount of your bet and try again.');
      } else if (error.message.includes('revert')) {
        setResult('Ttransactions failed in the blockchain.Check explorer for details.');
      } else {
        setResult('Error: Transaction Failed.Please try again or check Explorer for details.');
      }
    }
  }

  const openConnectModal = () => open({ view: 'Connect', namespace: 'eip155' });
  const handleDisconnect = async () => {
    await disconnect();
    setResult('');
    setBet('0.01');
    setGamePoolBalance(null);
    setHistory([]);
    setChoice(null);
    setCoinResult(null);
    setAnimationClass('');
  };
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="content-wrapper header-content">
          <label className="theme-switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider">
              <span className="theme-circle"></span>
            </span>
          </label>
          <div className="game-title">
            <span className="mon-logo">MON</span>
            <span className="flipcoin-text">FLIPCOIN</span>
          </div>
          <div className="wallet-section">
            {!isConnected ? (
              <button onClick={openConnectModal} className="connect-button animate-pop">
                <FaWallet /> Connect Wallet
              </button>
            ) : (
              <div className="wallet-connected">
                <FaWallet /> {address.slice(0, 6)}...{address.slice(-4)}
                <button onClick={handleDisconnect} className="disconnect-button animate-pop">
                  <FaSignOutAlt />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-container">
        <div className="content-wrapper">
          <div className="tab-section">
            <button
              className={`tab-button ${activeTab === 'play' ? 'active' : ''}`}
              onClick={() => setActiveTab('play')}
            >
              PLAY
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              HISTORY
            </button>
          </div>
          {activeTab === 'play' ? (
            !isConnected ? (
              <p className="connect-prompt">Please connect the wallet to start.</p>
            ) : (
              <div className="play-section animate-slide-up">
                <div className="coin-icon">
                  <img
                    src={coinResult === 'head' ? '/coin-head.png' : coinResult === 'tail' ? '/coin-tail.png' : '/coin.png'}
                    alt="Coin"
                    className={coinResult ? 'flip-animation' : ''}
                  />
                </div>
                <div className="coinflip-choice">
                  <button
                    className={`choice-button ${choice === 'head' ? 'selected' : ''}`}
                    onClick={() => setChoice('head')}
                  >
                    HEAD
                  </button>
                  <button
                    className={`choice-button ${choice === 'tail' ? 'selected' : ''}`}
                    onClick={() => setChoice('tail')}
                  >
                    TAIL
                  </button>
                </div>
                <div className="input-section">
                  <input
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(e.target.value)}
                    placeholder="0.01"
                    className="bet-input animate-fade-in"
                    disabled={status !== 'connected' || !choice}
                    step="0.01"
                    min="0.01"
                    max="1000"
                  />
                  <button
                    onClick={flipCoin}
                    className="guess-button animate-pop"
                    disabled={status !== 'connected' || !choice}
                  >
                    FLIP!!
                  </button>
                </div>
                {result && <div className={`result-message ${animationClass}`}>{result}</div>}
              </div>
            )
          ) : (
            <div className="history-section animate-slide-up">
              {history.length === 0 ? (
                <p className="no-history">There is no game history.</p>
              ) : (
                <div className="history-list">
                  {history.map((entry, index) => (
                    <div key={index} className="history-card">
                      <div className="history-card-header">
                        <span className="timestamp">{entry.timestamp}</span>
                        <span className={`result ${entry.won ? 'won' : 'lost'}`}>
                          {entry.choice.toUpperCase()} (Result: {entry.coinResult.toUpperCase()}) - {entry.won ? 'Win' : 'Kalah'} {entry.amount}
                        </span>
                      </div>
                      <div className="history-card-body">
                        <p>
                          <strong>Transaction hash:</strong>{' '}
                          <a
                            href={`${explorerUrl}/tx/${entry.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {entry.txHash.slice(0, 6)}...{entry.txHash.slice(-4)}
                          </a>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="app-footer">
        <div className="footer-text">
          <span>© 2025 MON Flipcoin by</span>
          <a href="https://github.com/Semutireng" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github"></i> @Semutireng
          </a>
          <span>&</span>
          <a href="https://twitter.com/caridipesbuk" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-twitter"></i> @caridipesbuk
          </a>
          <span>. All rights reserved.</span>
          <a href="https://yourdonationlink.com" target="_blank" rel="noopener noreferrer">
            <i className="fas fa-heart"></i> Donate as a thank you!
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;