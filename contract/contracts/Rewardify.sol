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
}
