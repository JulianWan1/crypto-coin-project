export interface CoinModalFieldData {
  coinType?: string,
  buySellEvent?: string;
  quantity: number | null,
  marketPrice: number | null,
  exchangePremium: number | null,
  networkFee: number | null,
  dateTime: Date | null
}