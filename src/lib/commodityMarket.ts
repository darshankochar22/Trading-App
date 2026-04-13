export type CommodityQuote = {
  symbol: string;
  lastPrice: number;
};

const BASE_QUOTES: CommodityQuote[] = [
  { symbol: "GOLD", lastPrice: 72250 },
  { symbol: "SILVER", lastPrice: 84200 },
  { symbol: "CRUDEOIL", lastPrice: 6830 },
  { symbol: "NATURALGAS", lastPrice: 236 },
  { symbol: "COPPER", lastPrice: 822 },
];

export function getCommodityQuotes(): CommodityQuote[] {
  return BASE_QUOTES;
}

