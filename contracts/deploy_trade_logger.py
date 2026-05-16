"""Deploy TradeLogger to 0G Mainnet (chain 16661, https://evmrpc.0g.ai)."""
import os
import json
from pathlib import Path
from web3 import Web3
from solcx import compile_source, install_solc

try:
    from dotenv import load_dotenv
    _ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"
    if _ENV_PATH.exists():
        load_dotenv(_ENV_PATH, override=False)
except ImportError:
    pass


def _resolve(env_names):
    for name in env_names:
        v = os.getenv(name)
        if v:
            return v
    return None


def deploy():
    install_solc("0.8.20")

    contract_dir = os.path.dirname(__file__)
    with open(os.path.join(contract_dir, "TradeLogger.sol")) as f:
        source = f.read()

    compiled = compile_source(
        source,
        output_values=["abi", "bin"],
        solc_version="0.8.20",
    )
    contract_id, contract_interface = compiled.popitem()
    abi = contract_interface["abi"]
    bytecode = contract_interface["bin"]

    rpc = _resolve(["ZERO_G_RPC_URL"])
    pk = _resolve(["ZERO_G_PRIVATE_KEY"])
    chain_id_env = _resolve(["ZERO_G_CHAIN_ID"]) or "16661"

    if not rpc:
        raise ValueError("ZERO_G_RPC_URL not set")
    if not pk:
        raise ValueError("ZERO_G_PRIVATE_KEY not set")

    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        raise ConnectionError(f"Failed to connect to {rpc}")

    detected_chain_id = w3.eth.chain_id
    account = w3.eth.account.from_key(pk)
    print(f"Deploying from: {account.address}")
    print(f"Chain ID (detected): {detected_chain_id}")
    print(f"Rollup chain ID (env): {chain_id_env or '(unset)'}")
    print(f"Balance: {w3.eth.get_balance(account.address) / 1e18}")

    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    tx = Contract.constructor().build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 500000,
        "gasPrice": w3.eth.gas_price,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"Tx sent: {tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"TradeLogger deployed at: {receipt.contractAddress}")
    print(f"Block: {receipt.blockNumber} | Gas: {receipt.gasUsed}")

    deployed_path = os.path.join(contract_dir, "trade_logger_deployed.json")
    with open(deployed_path, "w") as f:
        json.dump({
            "address": receipt.contractAddress,
            "abi": abi,
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "chain_id": chain_id_env,
            "evm_chain_id": detected_chain_id,
            "rpc_url": rpc,
        }, f, indent=2)

    print(f"Saved to {deployed_path}")


if __name__ == "__main__":
    deploy()
