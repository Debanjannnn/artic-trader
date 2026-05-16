const items = [
  { name: "EVM Rollup", type: "appchain" },
  { name: "Pyth", type: "price feeds" },
  { name: "Claude", type: "LLM" },
  { name: "GPT-4o", type: "LLM" },
  { name: "DeepSeek", type: "LLM" },
  { name: "Gemini", type: "LLM" },
  { name: "TwelveData", type: "candles" },
  { name: "CoinMarketCap", type: "data" },
  { name: "PostgreSQL", type: "storage" },
  { name: "Docker", type: "containers" },
  { name: "On-chain Audit", type: "immutable log" },
  { name: "WebSocket", type: "streaming" },
];

export function Ticker() {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-8 border-y border-foreground/6 bg-foreground">
      <div className="flex gap-15 items-center animate-ticker w-max">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="text-[13px] text-popover/50 whitespace-nowrap font-medium"
          >
            <strong className="text-background">{item.name}</strong> {item.type}
          </span>
        ))}
      </div>
    </div>
  );
}
