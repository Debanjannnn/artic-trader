// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {BacktestAttest} from "../src/BacktestAttest.sol";

/// @notice Deploys StrategyRegistry + BacktestAttest to Mantle Testnet.
/// @dev    Reads PRIVATE_KEY from env. Run with:
///           forge script script/DeployMantle.sol \
///             --rpc-url $MANTLE_TESTNET_RPC \
///             --broadcast
///         If Mantle requires legacy txs, append `--legacy` to the forge command.
contract DeployMantle is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        StrategyRegistry registry = new StrategyRegistry();
        BacktestAttest attest = new BacktestAttest();
        vm.stopBroadcast();

        console2.log("StrategyRegistry:", address(registry));
        console2.log("BacktestAttest:  ", address(attest));
        console2.log("Owner (registry):", registry.owner());
        // Ops: copy these into contracts/mantle_deployed.json.
    }
}
