// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BacktestAttest} from "../src/BacktestAttest.sol";

contract BacktestAttestTest is Test {
    BacktestAttest att;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    bytes32 constant H1 = keccak256("strategy-1");
    bytes32 constant H2 = keccak256("strategy-2");
    bytes32 constant D1 = keccak256("dataset-1");
    bytes32 constant D2 = keccak256("dataset-2");

    function setUp() public {
        att = new BacktestAttest();
    }

    function test_attest_appendsAndEmits() public {
        vm.prank(alice);
        att.attest(H1, D1, int32(140), uint16(1200), int32(2500), uint16(5500), uint32(42));

        BacktestAttest.Attestation[] memory all = att.getAttestations(H1);
        assertEq(all.length, 1);
        assertEq(all[0].strategyHash, H1);
        assertEq(all[0].datasetHash, D1);
        assertEq(all[0].sharpeBps, int32(140));
        assertEq(all[0].maxDdBps, uint16(1200));
        assertEq(all[0].totalReturnBps, int32(2500));
        assertEq(all[0].winRateBps, uint16(5500));
        assertEq(all[0].nTrades, uint32(42));
        assertEq(all[0].attester, alice);
        assertGt(all[0].timestamp, 0);
        assertEq(att.count(H1), 1);
    }

    function test_attest_twice_returnsBoth_andLatestIsLast() public {
        vm.prank(alice);
        att.attest(H1, D1, int32(140), uint16(1200), int32(2500), uint16(5500), uint32(42));

        vm.warp(block.timestamp + 100);

        vm.prank(bob);
        att.attest(H1, D2, int32(-50), uint16(2000), int32(-1000), uint16(4000), uint32(7));

        BacktestAttest.Attestation[] memory all = att.getAttestations(H1);
        assertEq(all.length, 2);
        assertEq(all[0].attester, alice);
        assertEq(all[1].attester, bob);

        BacktestAttest.Attestation memory last = att.latest(H1);
        assertEq(last.attester, bob);
        assertEq(last.datasetHash, D2);
        assertEq(last.sharpeBps, int32(-50));
        assertEq(last.totalReturnBps, int32(-1000));
    }

    function test_latest_revertsWhenEmpty() public {
        vm.expectRevert(BacktestAttest.NoAttestations.selector);
        att.latest(H1);
    }

    function test_attest_revertsOnZeroHash() public {
        vm.expectRevert(BacktestAttest.StrategyHashZero.selector);
        att.attest(bytes32(0), D1, 0, 0, 0, 0, 0);
    }

    function test_isolationBetweenStrategies() public {
        vm.prank(alice);
        att.attest(H1, D1, 1, 1, 1, 1, 1);
        assertEq(att.count(H1), 1);
        assertEq(att.count(H2), 0);
    }

    function test_negativeSharpeAndReturn() public {
        vm.prank(alice);
        att.attest(H1, D1, int32(-2147483648), uint16(0), int32(-2147483648), uint16(0), uint32(0));
        BacktestAttest.Attestation memory l = att.latest(H1);
        assertEq(l.sharpeBps, int32(-2147483648));
        assertEq(l.totalReturnBps, int32(-2147483648));
    }
}
