export class BuySellCoinEventEntity {

  coinId: number;
  eventType: number;
  buyQuantity: number | null;
  aggregatePrice: number | null;
  sellQuantity: number | null;
  marketPrice: number | null;
  networkFee: number | null;
  exchangePremium: number | null;
  eventDate: Date;

}