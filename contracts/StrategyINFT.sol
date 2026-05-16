// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title StrategyINFT — ERC-7857 Intelligent NFT for Artic trading strategies.
/// @notice Each token represents one tradable strategy. The strategy config is
///         stored off-chain (0G Storage) encrypted; this contract pins only the
///         metadata commitment and an oracle-managed sealedConfigHash. Buyers
///         receive execution rights via `authorizeUsage` without ever seeing
///         the cleartext config. On transfer the contract emits a
///         `MetadataReencrypted` event that the off-chain oracle observes to
///         rotate the encryption key for the new owner.
/// @dev Minimal ERC-7857 surface — deliberately small to fit the testnet budget.
contract StrategyINFT is ERC721 {
    /// @dev keccak256(encrypted blob) — proves data integrity off-chain.
    mapping(uint256 => bytes32) public metadataHash;
    /// @dev keccak256(sealed config) — rotated on every transfer by oracle.
    mapping(uint256 => bytes32) public sealedConfigHash;
    /// @dev tokenId => user => authorized to execute strategy.
    mapping(uint256 => mapping(address => bool)) public usageAuthorized;

    address public owner;
    address public oracle;
    uint256 private _nextId;

    event Minted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 metadataHash,
        bytes32 sealedConfigHash
    );
    event UsageAuthorized(uint256 indexed tokenId, address indexed user);
    event UsageRevoked(uint256 indexed tokenId, address indexed user);
    event MetadataReencrypted(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        bytes32 oldSealedConfigHash
    );
    event SealedConfigUpdated(uint256 indexed tokenId, bytes32 newSealedConfigHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "not oracle");
        _;
    }

    constructor() ERC721("Artic Strategy INFT", "ASINFT") {
        owner = msg.sender;
        oracle = msg.sender;
    }

    /// @notice Mint a new strategy INFT.
    /// @param to Recipient.
    /// @param _metadataHash keccak256 commitment to encrypted metadata blob on 0G Storage.
    /// @param _sealedConfigHash keccak256 commitment to sealed (recipient-encrypted) config.
    /// @return tokenId Newly minted id.
    function mint(
        address to,
        bytes32 _metadataHash,
        bytes32 _sealedConfigHash
    ) external onlyOwner returns (uint256 tokenId) {
        unchecked { tokenId = ++_nextId; }
        metadataHash[tokenId] = _metadataHash;
        sealedConfigHash[tokenId] = _sealedConfigHash;
        _safeMint(to, tokenId);
        emit Minted(tokenId, to, _metadataHash, _sealedConfigHash);
    }

    /// @notice Grant `user` the right to execute strategy `tokenId` off-chain.
    ///         Does NOT expose the config; the agent runtime verifies authorization.
    function authorizeUsage(uint256 tokenId, address user) external {
        require(ownerOf(tokenId) == msg.sender, "not token owner");
        usageAuthorized[tokenId][user] = true;
        emit UsageAuthorized(tokenId, user);
    }

    function revokeUsage(uint256 tokenId, address user) external {
        require(ownerOf(tokenId) == msg.sender, "not token owner");
        usageAuthorized[tokenId][user] = false;
        emit UsageRevoked(tokenId, user);
    }

    /// @notice Oracle finalizes re-encryption after a transfer by writing the
    ///         new sealedConfigHash bound to the new owner's pubkey.
    function setSealedConfigHash(uint256 tokenId, bytes32 newHash) external onlyOracle {
        require(_ownerOf(tokenId) != address(0), "no token");
        sealedConfigHash[tokenId] = newHash;
        emit SealedConfigUpdated(tokenId, newHash);
    }

    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /// @dev ERC-7857: every ownership change triggers off-chain re-encryption.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address from) {
        from = super._update(to, tokenId, auth);
        // skip on mint (from == 0) — initial sealed hash set in mint().
        if (from != address(0) && to != address(0)) {
            bytes32 prev = sealedConfigHash[tokenId];
            // invalidate the sealed config; oracle must rotate before use.
            sealedConfigHash[tokenId] = bytes32(0);
            emit MetadataReencrypted(tokenId, from, to, prev);
        }
    }
}
