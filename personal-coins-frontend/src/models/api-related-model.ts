export interface LiveCoinWatchSingleCoinRequest {
	currency: string,
	code: string,
	meta: boolean
}

export interface UnrealisedProfitLossPercentageCalculatorResponse {
  currentCoinMarketPrice: number | null,
  unrealisedProfitLossPercentage: number | null
}

export interface CoinEventUpdateRequestBody {
	id: number,
	coinName: string,
	eventType: number,
	buySellQuantity?: number,
	marketPrice?: number,
	networkFee?: number,
	exchangePremium?: number,
	eventDate?: Date
}

export interface CoinEventUpdateRequestBodyRelevantFields {
	buySellQuantity?: number,
	marketPrice?: number,
	networkFee?: number,
	exchangePremium?: number,
	eventDate?: Date
}

// Have to use index signature for this when looping with an undetermined key
export interface UpdateModalFields {
	[key:string]: number|Date 
}

export interface BuySellCreateCoinRequestBody {
	coinName: string;
	coinCode: string;
	buySellQuantity: number;
	marketPrice: number;
	networkFee: number;
	exchangePremium: number;
	buySellDate: Date;
}

export interface MakeBuySellCoinRequestParameter {
	requestBody: BuySellCreateCoinRequestBody; 
	selectedBuyOrSellOption: string;
}