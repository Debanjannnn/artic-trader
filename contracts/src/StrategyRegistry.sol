// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title StrategyRegistry
/// @notice On-chain registry of published marketplace strategies. Anyone can
///         publish; one entry per strategyHash. Author or platform owner may delist.
/// @dev    Pure registry. No fund custody, no payments.
contract StrategyRegistry is Ownable {
    /// @notice Max bytes for `name` field on publish.
    uint256 public constant MAX_NAME_BYTES = 64;

    struct Strategy {
        bytes32 strategyHash;   // sha256 of source code
        address author;
        bytes32 codeCID;        // IPFS CID (bytes32) — may be zero until IPFS wired
        string name;
        uint64 publishedAt;
        bool delisted;
    }

    /// @notice strategyHash => Strategy.
    mapping(bytes32 => Strategy) public strategies;

    /// @notice author => list of strategyHashes they have published.
    mapping(address => bytes32[]) public byAuthor;

    event StrategyPublished(
        bytes32 indexed strategyHash,
        address indexed author,
        bytes32 codeCID,
        string name
    );
    event StrategyDelisted(bytes32 indexed strategyHash, address indexed by);

    error AlreadyPublished();
    error UnknownStrategy();
    error NameEmpty();
    error NameTooLong();
    error HashZero();
    error NotAuthorized();
    error AlreadyDelisted();

    constructor() Ownable(msg.sender) {}

    /// @notice Publish a new strategy entry. Reverts if hash already published.
    /// @param strategyHash sha256 of strategy source code (must be non-zero).
    /// @param codeCID      IPFS CID (bytes32). May be zero.
    /// @param name         Human-readable name, 1..MAX_NAME_BYTES bytes.
    function publish(bytes32 strategyHash, bytes32 codeCID, string calldata name) external {
        if (strategyHash == bytes32(0)) revert HashZero();
        uint256 len = bytes(name).length;
        if (len == 0) revert NameEmpty();
        if (len > MAX_NAME_BYTES) revert NameTooLong();
        if (strategies[strategyHash].author != address(0)) revert AlreadyPublished();

        strategies[strategyHash] = Strategy({
            strategyHash: strategyHash,
            author: msg.sender,
            codeCID: codeCID,
            name: name,
            publishedAt: uint64(block.timestamp),
            delisted: false
        });
        byAuthor[msg.sender].push(strategyHash);

        emit StrategyPublished(strategyHash, msg.sender, codeCID, name);
    }

    /// @notice Delist a strategy. Callable by the original author or contract owner.
    function delist(bytes32 strategyHash) external {
        Strategy storage s = strategies[strategyHash];
        if (s.author == address(0)) revert UnknownStrategy();
        if (msg.sender != s.author && msg.sender != owner()) revert NotAuthorized();
        if (s.delisted) revert AlreadyDelisted();
        s.delisted = true;
        emit StrategyDelisted(strategyHash, msg.sender);
    }

    /// @notice Fetch a strategy by hash. Returns zeroed struct if unknown.
    function get(bytes32 strategyHash) external view returns (Strategy memory) {
        return strategies[strategyHash];
    }

    /// @notice List strategy hashes published by an author.
    function getByAuthor(address author) external view returns (bytes32[] memory) {
        return byAuthor[author];
    }
}
