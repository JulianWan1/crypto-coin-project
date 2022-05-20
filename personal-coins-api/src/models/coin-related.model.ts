import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";

// for any interfaces / classes related to the coins api
export class NewCoinAdded{
  status: boolean;
  latestCoin: Portfolio;
  latestCoinId: number;
  latestCoinAddedDate: Date;
}

export class NewBuySellAdded{
  status: boolean;
  latestBuySellEvent: BuySellCoinEvent;
  coinId: number;
  latestBuySellDate: Date;
}