export type Side = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "OPEN" | "FILLED" | "CANCELLED";

export type TradeOrder = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  executedPrice?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExecutedTrade = {
  id: string;
  orderId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  value: number;
  createdAt: string;
};

export type Holding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
};

export type PortfolioSnapshot = {
  cash: number;
  invested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  holdings: Holding[];
};

export type PlaceOrderRequest = {
  symbol: string;
  side: Side;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
};

