// Table related models

export interface Coin {
  id: number;
  coinName: string;
  currentAmountOwned: number;
  currentCoinMarketPrice: number;
  dollarCostAverage: number;
  dollarSoldAverage: number; // may need a previous dollarCostAverage to help calculate realisedProfitLossPercentage?
  totalBought: number;
  totalSold: number;
  unrealisedProfitLossPercentage: number;
  realisedProfitLossPercentage: number;
  lastBoughtAmount: number;
  lastBoughtDate: string;
  lastSoldAmount: number;
  lastSoldDate: string;
}
