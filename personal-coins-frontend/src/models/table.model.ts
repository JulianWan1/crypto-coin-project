// Table related models

// export interface Coin {
//   id: number;
//   coinName: string;
//   currentAmountOwned: number;
//   currentCoinMarketPrice: number;
//   dollarCostAverage: number;
//   dollarSoldAverage: number; // may need a previous dollarCostAverage to help calculate realisedProfitLossPercentage?
//   totalBought: number;
//   totalSold: number;
//   unrealisedProfitLossPercentage: number;
//   realisedProfitLossPercentage: number;
//   lastBoughtAmount: number;
//   lastBoughtDate: string;
//   lastSoldAmount: number;
//   lastSoldDate: string;
// }
export interface Coin {
  id: number;
  coinName: string;
  coinCode: string;
  currentAmountOwned: number | null;
  currentCoinMarketPrice?: number,
  currentDollarCostAverage: number | null;
  dollarSoldAverage: number | null;
  totalBought: number | null;
  totalSold: number | null;
  unrealisedProfitLossPercentage?: number | null;
  realisedProfitLossPercentage: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastBoughtAmount: number;
  lastBoughtDate: Date;
  lastSoldAmount: number | null;
  lastSoldDate: Date | null;
}

export interface CoinEvent {
  coinName: string;
  coinEventLog: CoinEventLog[];
}

export interface CoinEventLog {
  id: number;
  coinId: number;
  eventType: number;
  buyQuantity: number | null;
  aggregatePrice: number | null;
  sellQuantity: number | null;
  marketPrice: number | null;
  networkFee: number | null;
  exchangePremium: number | null;
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
