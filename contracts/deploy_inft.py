"""Deploy StrategyINFT (ERC-7857) to 0G Galileo testnet.

Mirrors deploy.py — loads RPC + key from .env.local, compiles via solcx with
OpenZeppelin remapping resolved against the git submodule under lib/.
"""
import os
import json
from pathlib import Path
from web3 import Web3
from solcx import compile_standard, install_solc

try:
    from dotenv import load_dotenv
    _ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"
    if _ENV_PATH.exists():
        load_dotenv(_ENV_PATH, override=False)
except ImportError:
    pass


SOLC_VERSION = "0.8.26"


def _resolve(env_names):
    for name in env_names:
        v = os.getenv(name)
        if v:
            return v
    return None


def _compile(contract_dir: Path):
    src_path = contract_dir / "StrategyINFT.sol"
    oz_path = contract_dir / "lib" / "openzeppelin-contracts"

    sources = {"StrategyINFT.sol": {"urls": [str(src_path)]}}

    standard_input = {
        "language": "Solidity",
        "sources": sources,
        "settings": {
            "remappings": [
                f"@openzeppelin/contracts/={oz_path / 'contracts'}/",
            ],
            "optimizer": {"enabled": True, "runs": 200},
            "evmVersion": "cancun",
            "outputSelection": {
                "*": {"*": ["abi", "evm.bytecode.object"]}
            },
        },
    }

    out = compile_standard(
        standard_input,
        allow_paths=[str(contract_dir), str(oz_path)],
        solc_version=SOLC_VERSION,
    )
    contract = out["contracts"]["StrategyINFT.sol"]["StrategyINFT"]
    return contract["abi"], contract["evm"]["bytecode"]["object"]


def deploy():
    install_solc(SOLC_VERSION)
    contract_dir = Path(__file__).resolve().parent

    abi, bytecode = _compile(contract_dir)

    rpc = _resolve(["ZERO_G_RPC_URL", "CHAIN_RPC_URL"])
    pk = _resolve(["CHAIN_PRIVATE_KEY"])
    chain_id_env = _resolve(["ZERO_G_CHAIN_ID", "CHAIN_ID"])

    if not rpc:
        raise ValueError("ZERO_G_RPC_URL not set")
    if not pk:
        raise ValueError("CHAIN_PRIVATE_KEY not set")

    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        raise ConnectionError(f"Failed to connect to {rpc}")

    detected_chain_id = w3.eth.chain_id
    account = w3.eth.account.from_key(pk)
    print(f"Deploying from: {account.address}")
    print(f"Chain ID (detected): {detected_chain_id}")
    print(f"Rollup chain ID (env): {chain_id_env or '(unset)'}")
    print(f"Balance: {w3.eth.get_balance(account.address) / 1e18}")
    print(f"Bytecode size: {len(bytecode) // 2} bytes")

    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    # estimate gas with a buffer; fall back if estimation fails.
    try:
        est = Contract.constructor().estimate_gas({"from": account.address})
        gas_limit = int(est * 12 // 10)
        print(f"Estimated gas: {est} -> using {gas_limit}")
    except Exception as e:
        gas_limit = 3_500_000
        print(f"Gas estimate failed ({e}); using fallback {gas_limit}")

    tx = Contract.constructor().build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": gas_limit,
        "gasPrice": gas_price,
        "chainId": detected_chain_id,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"Tx sent: {tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        raise RuntimeError(f"Deployment reverted: {receipt}")
    print(f"StrategyINFT deployed at: {receipt.contractAddress}")
    print(f"Block: {receipt.blockNumber} | Gas: {receipt.gasUsed}")

    deployed_path = contract_dir / "inft_deployed.json"
    with open(deployed_path, "w") as f:
        json.dump({
            "address": receipt.contractAddress,
            "abi": abi,
            "tx_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "gas_used": receipt.gasUsed,
            "chain_id": chain_id_env,
            "evm_chain_id": detected_chain_id,
            "rpc_url": rpc,
        }, f, indent=2)
    print(f"Saved to {deployed_path}")


if __name__ == "__main__":
    deploy()
