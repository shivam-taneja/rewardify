// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Rewardify - Channel-based reward pools (hackathon-ready)
/// @notice Stores channelId -> owner on-chain. Tip by channelId, owner withdraws and can distribute to viewers.
contract Rewardify {
    struct ChannelPool {
        address owner; // Creator's wallet
        uint256 balance; // ETH in pool
    }

    // channelId (hashed) => pool info
    mapping(bytes32 => ChannelPool) public channelPools;

    // Backend address that can execute withdrawals on behalf of owners
    address public backend;

    // Events
    event PoolCreated(bytes32 indexed channelId, address indexed owner);
    event WalletUpdated(
        bytes32 indexed channelId,
        address indexed oldOwner,
        address indexed newOwner
    );
    event Tipped(
        bytes32 indexed channelId,
        address indexed from,
        uint256 amount
    );
    event Withdrawn(
        bytes32 indexed channelId,
        address indexed creator,
        uint256 totalAmount
    );

    constructor() {
        backend = msg.sender; // Deployer is the backend
    }

    /// @notice Create a pool for a verified channel.
    /// @param channelId keccak256 hashed channel id (e.g. keccak256("UCxxx..."))
    /// @param owner creator wallet address
    function createPool(bytes32 channelId, address owner) external {
        require(owner != address(0), "Invalid owner");
        require(
            channelPools[channelId].owner == address(0),
            "Pool already exists"
        );

        channelPools[channelId] = ChannelPool({owner: owner, balance: 0});
        emit PoolCreated(channelId, owner);
    }

    /// @notice Tip a channel's pool - funds accumulate in the pool
    /// @param channelId hashed channel id
    function tip(bytes32 channelId) external payable {
        ChannelPool storage pool = channelPools[channelId];
        require(pool.owner != address(0), "Channel not registered");
        require(msg.value > 0, "No ETH sent");

        // Add tip to pool balance
        pool.balance += msg.value;
        emit Tipped(channelId, msg.sender, msg.value);
    }

    /// @notice Withdraw and distribute - backend specifies all recipients and amounts
    /// @param channelId hashed channel id
    /// @param recipients array of wallet addresses (creator, platform, top viewer, etc.)
    /// @param amounts array of amounts for each recipient (must match recipients length)
    function withdraw(
        bytes32 channelId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        ChannelPool storage pool = channelPools[channelId];
        require(pool.owner != address(0), "Channel not registered");
        
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");

        uint256 totalPool = pool.balance;
        require(totalPool > 0, "Empty pool");

        // Calculate total payout
        uint256 totalPayout = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalPayout += amounts[i];
        }

        // Ensure we don't pay out more than pool balance
        require(totalPayout <= totalPool, "Payout exceeds pool balance");

        // Reset pool before transfers (reentrancy safety)
        pool.balance = 0;

        // Send to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            if (amounts[i] == 0) continue;

            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}(
                ""
            );
            require(success, "Transfer failed");
        }

        emit Withdrawn(channelId, pool.owner, totalPool);
    }

    /// @notice Get pool balance for a channelId
    function getPoolBalance(bytes32 channelId) external view returns (uint256) {
        return channelPools[channelId].balance;
    }

    /// @notice Get owner wallet for a channelId
    function getOwner(bytes32 channelId) external view returns (address) {
        return channelPools[channelId].owner;
    }


    // If someone sends ETH directly to the contract, reject to avoid accidental locks
    receive() external payable {
        revert("Use tip(channelId) to send funds");
    }

    fallback() external payable {
        revert("Use tip(channelId) to send funds");
    }
}