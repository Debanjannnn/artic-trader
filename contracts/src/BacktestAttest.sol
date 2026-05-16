// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BacktestAttest
/// @notice Per-strategy backtest result attestation. Anyone may attest. Many
///         attestations per strategy are allowed (re-runs, multiple datasets).
/// @dev    Pure logging. No fund custody, no validation of metric values.
contract BacktestAttest {
    struct Attestation {
        bytes32 strategyHash;
        bytes32 datasetHash;    // hash of (symbol, period_start, period_end, granularity)
        int32 sharpeBps;        // Sharpe * 100 (e.g. 140 = 1.40)
        uint16 maxDdBps;        // max drawdown in bps (1200 = 12%)
        int32 totalReturnBps;   // total return in bps
        uint16 winRateBps;
        uint32 nTrades;
        address attester;
        uint64 timestamp;
    }

    /// @notice strategyHash => list of attestations (chronological, append-only).
    mapping(bytes32 => Attestation[]) public attestations;

    event Backtested(
        bytes32 indexed strategyHash,
        bytes32 indexed datasetHash,
        int32 sharpeBps,
        uint16 maxDdBps,
        int32 totalReturnBps,
        uint16 winRateBps,
        uint32 nTrades,
        address attester
    );

    error NoAttestations();
    error StrategyHashZero();

    /// @notice Append a new attestation. Open verifiability — no caller restriction.
    function attest(
        bytes32 strategyHash,
        bytes32 datasetHash,
        int32 sharpeBps,
        uint16 maxDdBps,
        int32 totalReturnBps,
        uint16 winRateBps,
        uint32 nTrades
    ) external {
        if (strategyHash == bytes32(0)) revert StrategyHashZero();

        attestations[strategyHash].push(
            Attestation({
                strategyHash: strategyHash,
                datasetHash: datasetHash,
                sharpeBps: sharpeBps,
                maxDdBps: maxDdBps,
                totalReturnBps: totalReturnBps,
                winRateBps: winRateBps,
                nTrades: nTrades,
                attester: msg.sender,
                timestamp: uint64(block.timestamp)
            })
        );

        emit Backtested(
            strategyHash,
            datasetHash,
            sharpeBps,
            maxDdBps,
            totalReturnBps,
            winRateBps,
            nTrades,
            msg.sender
        );
    }

    /// @notice Return all attestations for a strategy (may be empty).
    function getAttestations(bytes32 strategyHash) external view returns (Attestation[] memory) {
        return attestations[strategyHash];
    }

    /// @notice Latest attestation for a strategy. Reverts if none.
    function latest(bytes32 strategyHash) external view returns (Attestation memory) {
        Attestation[] storage arr = attestations[strategyHash];
        if (arr.length == 0) revert NoAttestations();
        return arr[arr.length - 1];
    }

    /// @notice Number of attestations recorded for a strategy.
    function count(bytes32 strategyHash) external view returns (uint256) {
        return attestations[strategyHash].length;
    }
}
