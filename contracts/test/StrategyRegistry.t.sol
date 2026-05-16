// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";

contract StrategyRegistryTest is Test {
    StrategyRegistry reg;

    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address stranger = address(0xDEAD);

    bytes32 constant H1 = keccak256("strategy-1");
    bytes32 constant H2 = keccak256("strategy-2");
    bytes32 constant CID1 = keccak256("cid-1");

    function setUp() public {
        reg = new StrategyRegistry();
    }

    function test_publish_storesAndEmits() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "MeanRev v1");

        StrategyRegistry.Strategy memory s = reg.get(H1);
        assertEq(s.strategyHash, H1);
        assertEq(s.author, alice);
        assertEq(s.codeCID, CID1);
        assertEq(s.name, "MeanRev v1");
        assertGt(s.publishedAt, 0);
        assertFalse(s.delisted);

        bytes32[] memory hashes = reg.getByAuthor(alice);
        assertEq(hashes.length, 1);
        assertEq(hashes[0], H1);
    }

    function test_publish_allowsZeroCID() public {
        vm.prank(alice);
        reg.publish(H1, bytes32(0), "no-ipfs-yet");
        assertEq(reg.get(H1).codeCID, bytes32(0));
    }

    function test_publish_revertsOnDouble() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "v1");
        vm.prank(bob);
        vm.expectRevert(StrategyRegistry.AlreadyPublished.selector);
        reg.publish(H1, CID1, "stolen");
    }

    function test_publish_revertsOnZeroHash() public {
        vm.prank(alice);
        vm.expectRevert(StrategyRegistry.HashZero.selector);
        reg.publish(bytes32(0), CID1, "n");
    }

    function test_publish_revertsOnEmptyName() public {
        vm.prank(alice);
        vm.expectRevert(StrategyRegistry.NameEmpty.selector);
        reg.publish(H1, CID1, "");
    }

    function test_publish_revertsOnNameTooLong() public {
        // 65 bytes
        string memory tooLong = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        assertEq(bytes(tooLong).length, 65);
        vm.prank(alice);
        vm.expectRevert(StrategyRegistry.NameTooLong.selector);
        reg.publish(H1, CID1, tooLong);
    }

    function test_delist_byAuthor() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "v1");
        vm.prank(alice);
        reg.delist(H1);
        assertTrue(reg.get(H1).delisted);
    }

    function test_delist_byOwner() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "v1");
        // owner == this contract (deployer)
        reg.delist(H1);
        assertTrue(reg.get(H1).delisted);
    }

    function test_delist_revertsOnStranger() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "v1");
        vm.prank(stranger);
        vm.expectRevert(StrategyRegistry.NotAuthorized.selector);
        reg.delist(H1);
    }

    function test_delist_revertsOnUnknown() public {
        vm.expectRevert(StrategyRegistry.UnknownStrategy.selector);
        reg.delist(H1);
    }

    function test_delist_revertsOnDouble() public {
        vm.prank(alice);
        reg.publish(H1, CID1, "v1");
        vm.prank(alice);
        reg.delist(H1);
        vm.prank(alice);
        vm.expectRevert(StrategyRegistry.AlreadyDelisted.selector);
        reg.delist(H1);
    }

    function test_getByAuthor_multiple() public {
        vm.startPrank(alice);
        reg.publish(H1, CID1, "v1");
        reg.publish(H2, CID1, "v2");
        vm.stopPrank();
        bytes32[] memory hs = reg.getByAuthor(alice);
        assertEq(hs.length, 2);
        assertEq(hs[0], H1);
        assertEq(hs[1], H2);
        assertEq(reg.getByAuthor(bob).length, 0);
    }
}
