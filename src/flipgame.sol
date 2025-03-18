// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CoinflipGame {
    address public immutable owner;
    uint256 public gamePool; // Dana game (80% dari bet kalah)
    uint256 public devPool;  // Dana developer (20% dari bet kalah)
    uint256 public constant MIN_BET = 0.01 ether; // Bet minimum

    enum Choice { Head, Tail }
    event FlipResult(address indexed player, uint8 playerChoice, bool won, uint256 amount, uint256 bet, bytes32 requestId);
    event BetPlaced(address indexed player, uint256 bet);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // Fungsi untuk flip koin
    function flipCoin(uint8 _choice) external payable {
        require(msg.value >= MIN_BET, "Bet must be at least 0.01 MON");
        require(_choice <= 1, "Invalid choice: must be 0 (Head) or 1 (Tail)");
        require(gamePool >= msg.value * 2, "Insufficient game pool to pay winnings");

        emit BetPlaced(msg.sender, msg.value);

        // Simulasi keacakan (Sementara - Tidak Aman untuk Produksi)
        bytes32 requestId = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, block.number));
        bool result = uint256(requestId) % 2 == 0; // 0 untuk Head, 1 untuk Tail

        bool won = (_choice == 0 && result) || (_choice == 1 && !result);
        uint256 bet = msg.value;

        if (won) {
            // Pemain menang: bayar 2x bet dari game pool
            uint256 winnings = bet * 2;
            gamePool -= winnings;
            payable(msg.sender).transfer(winnings);
            emit FlipResult(msg.sender, _choice, true, winnings, bet, requestId);
        } else {
            // Pemain kalah: bagi bet ke game pool (80%) dan dev pool (20%)
            uint256 devShare = (bet * 20) / 100;
            uint256 gameShare = bet - devShare;
            gamePool += gameShare;
            devPool += devShare;
            emit FlipResult(msg.sender, _choice, false, 0, bet, requestId);
        }
    }

    // Fungsi untuk owner menarik dana developer
    function withdrawDevFunds() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 amount = devPool;
        require(amount > 0, "No funds to withdraw");
        devPool = 0;
        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    // Fungsi untuk menambah dana ke game pool
    function fundGamePool() external payable {
        require(msg.sender == owner, "Only owner can fund");
        gamePool += msg.value;
    }

    // Fungsi untuk melihat saldo kontrak
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Transfer langsung akan masuk ke gamePool
    receive() external payable {
        gamePool += msg.value;
    }
}