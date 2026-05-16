"""Hub configuration via pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core
    DATABASE_URL: str = ""  # postgresql+asyncpg://...
    ENV: str = "dev"  # dev | staging | prod
    HUB_PORT: int = 8000

    # Auth / secrets
    JWT_SECRET: str = "changeme-jwt"
    JWT_EXPIRY_MINUTES: int = 720  # 12h access token (was 15m)
    REFRESH_EXPIRY_DAYS: int = 90  # 90d refresh window (was 30d)
    KEK: str = ""  # 32-byte base64; required in prod
    INTERNAL_SECRET: str = "changeme"  # shared with user-server (legacy name)

    # mTLS
    HUB_CA_KEY_PATH: str = ""  # PEM file on disk; dev generates self-signed
    HUB_CA_CERT_PATH: str = ""

    # VM provider
    VM_PROVIDER: str = "morph"  # morph | firecracker
    VM_PROVIDER_TOKEN: str = ""
    VM_IMAGE_TAG: str = "v0"  # local docker tag on images baked into golden snapshot
    HUB_PUBLIC_URL: str = ""  # reachable from Morph VM; used by golden build + user-server callbacks
    MORPH_API_KEY: str = ""
    MORPH_BASE_URL: str = "https://cloud.morph.so/api"
    BASE_SNAPSHOT_ID: str = ""
    MORPH_GOLDEN_SNAPSHOT_ID: str = ""

    # Market
    TWELVE_DATA_API_KEY: str = ""
    PYTH_HERMES_URL: str = "https://hermes.pyth.network"
    CANDLE_STALENESS_SECONDS: int = 60
    PRICE_POLL_SECONDS: float = 2.0

    # User-server direct (platform-internal endpoints; used by publish flow)
    USER_SERVER_INTERNAL_URL: str = "http://localhost:8001"
    PUBLISH_BACKTEST_TIMEOUT_SECONDS: float = 60.0

    # Mantle on-chain (StrategyRegistry + BacktestAttest)
    MANTLE_RPC_URL: str = ""
    MANTLE_PRIVATE_KEY: str = ""
    STRATEGY_REGISTRY_ADDRESS: str = ""
    BACKTEST_ATTEST_ADDRESS: str = ""

    # Proxy
    PROXY_CONNECT_TIMEOUT_SECONDS: float = 5.0
    PROXY_READ_TIMEOUT_SECONDS: float = 10.0
    VM_WAKE_TIMEOUT_SECONDS: float = 10.0

    # Chain / funder (stubbed this branch)
    HSK_RPC_URL: str = ""
    PLATFORM_WALLET_KEY: str = ""
    FUND_FLOOR_WEI: int = 0
    FUND_TOPUP_WEI: int = 0
    FUND_INTERVAL_SEC: int = 18000

    # OTel
    OTEL_COLLECTOR_URL: str = ""

    # Wallet auth
    AUTH_MESSAGE_DOMAIN: str = "artic.trade"
    AUTH_NONCE_TTL_SECONDS: int = 300
    AUTH_SESSION_TTL_SECONDS: int = 604800  # 7d (was 8h)
    AUTH_SUPPORTED_CHAINS: str = "0g-mainnet"

    # 0G Mainnet
    ZERO_G_RPC_URL: str = "https://evmrpc.0g.ai"
    ZERO_G_CHAIN_ID: int = 16661
    ZERO_G_EXPLORER_BASE: str = "https://chainscan.0g.ai"
    ZERO_G_PRIVATE_KEY: str = ""
    ZERO_G_COMPUTE_SERVING_BROKER: str = ""
    ZERO_G_STORAGE_INDEXER_URL: str = "https://indexer-storage-turbo.0g.ai"
    DECISION_LOGGER_ADDRESS: str = "0x70a15Db526104abC2f021b7c690cd89a07EDE49C"
    TRADE_LOGGER_ADDRESS: str = "0xeeb56334152D6bDB62aacF56f8DbCceA5210b78D"
    INFT_CONTRACT_ADDRESS: str = "0x2A9caFEDFc91d55E00B6d1514E39BeB940832b5D"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
