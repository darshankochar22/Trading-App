export type MarketIndex = {
  key: string;
  name: string;
  value: number;
  change: number;
  percentChange: number;
};

export type MarketStock = {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  dayHigh: number;
  dayLow: number;
  totalTradedValue: number;
};

export type MarketOverviewResponse = {
  ok: boolean;
  indices: MarketIndex[];
  stocks: MarketStock[];
  asOf: string;
  message?: string;
};

export type IpoItem = {
  name: string;
  symbol: string;
  issueStartDate: string;
  issueEndDate: string;
  priceBand: string;
  issueSize: string;
};

export type MutualFundItem = {
  code: string;
  schemeName: string;
};

export type MutualFundMetrics = {
  code: string;
  latestNav: number;
  navDate: string;
  return1Y: number | null;
  return3Y: number | null;
};

export type MarketDepthLevel = {
  price: number;
  quantity: number;
  orders: number;
};

export type MarketDepth = {
  symbol: string;
  bids: MarketDepthLevel[];
  asks: MarketDepthLevel[];
  lastPrice: number;
  change: number;
  pChange: number;
  asOf: string;
};

export type MarketHistoryPoint = {
  timestamp: string;
  close: number;
};

export type StraddleRow = {
  indexName: string;
  lastTraded: number;
  dayChange: number;
  dayChangePercent: number;
  open: number;
  high: number;
  low: number;
  lastClose: number;
  atmStrike: number;
  straddlePrice: number;
};

