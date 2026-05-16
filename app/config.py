"""App configuration via pydantic-settings."""
from typing import Optional

from pydantic_settings import BaseSettings


class AppSettings(BaseSettings):
    # Hub connection (injected by hub at spawn)
    HUB_URL: str = ""
    HUB_AGENT_ID: str = ""
    INTERNAL_SECRET: str = ""

    # Trading config defaults — overridden by /start body
    SYMBOL: str = "BTCUSDT"
    AMOUNT_USDT: float = 100.0
    LEVERAGE: int = 5

    # API keys
    TWELVE_DATA_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    CMC_API_KEY: str = ""

    # Exchange (live mode)
    HASHKEY_API_KEY: str = ""
    HASHKEY_SECRET: str = ""

    # Optional MongoDB cache
    MONGODB_URI: str = ""

    # On-chain (0G Mainnet)
    ZERO_G_RPC_URL: str = "https://evmrpc.0g.ai"
    ZERO_G_PRIVATE_KEY: str = ""
    ZERO_G_CHAIN_ID: str = "16661"
    ZERO_G_EXPLORER_BASE: str = "https://chainscan.0g.ai"
    ZERO_G_COMPUTE_SECRET: str = ""
    ZERO_G_COMPUTE_PROVIDER: str = ""
    ZERO_G_COMPUTE_SERVING_BROKER: str = ""
    # 0G Storage (Log Layer) — full LLM reasoning + trade detail JSON live here;
    # only the content root hash lands on-chain.
    ZERO_G_STORAGE_INDEXER_URL: str = "https://indexer-storage-turbo.0g.ai"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = AppSettings()
