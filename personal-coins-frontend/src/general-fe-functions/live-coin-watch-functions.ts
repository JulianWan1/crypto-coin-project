import { Endpoints } from "@/endpoints/endpoints";
import { LiveCoinWatchSingleCoinRequest, UnrealisedProfitLossPercentageCalculatorResponse } from "@/models/api-related-model";
import { Coin } from "@/models/table.model";
import { liveCoinWatchAxios } from "@/utils/axios";

export class LiveCoinWatchFunctions {
  // To calculate the unrealised profit and loss percentage of a coin
  async unrealisedProfitLossPercentageCalculator(coinObject:Coin){
    // get coinCode to call the LiveCoinWatchAPI
    // get current DCA of coin to be used eventually in calculation
    const{
      coinCode,
      currentDollarCostAverage
    } = coinObject;
    console.log(`coinCode: ${coinCode}, currentDollarCostAverage: ${currentDollarCostAverage}`)
    // Set the request body for the API call to livecoinwatch
    // liveCoinWatchAxios is an instance of axios that already has the necessary baseURL and header set to make a complete call
    const singleCoinRequestBody: LiveCoinWatchSingleCoinRequest = {
      "currency": "USD",
      "code": `${coinCode}`,
      "meta": true
    }
    // Make LiveCoinWatch API request (LiveCoinWatchAPIs only take POST requests (13/06/2022))
    let marketPriceAndProfitLossPercentage: UnrealisedProfitLossPercentageCalculatorResponse  = {
      currentCoinMarketPrice: null,
      unrealisedProfitLossPercentage: null
    }
    try {
      const apiCall = async() => {
        const response = await liveCoinWatchAxios.post(
          Endpoints.LiveCoinWatchSingleCoinEndpoint,
          singleCoinRequestBody
        );
        return response.data;
      }
      // Retrieve data from the API call
      const singleCoinData = await apiCall();
      console.log(JSON.parse(JSON.stringify(singleCoinData)));
      const currentCoinMarketPrice: number = singleCoinData.rate;
      console.log(`currentDollarCostAverage: ${currentDollarCostAverage}`);
      const unrealisedProfitLossPercentage: number | null = 
        // currentDollarCostAverage is read as a string variable type instead of number type, 
        // hence will regard 0 as "0", and mistakenly pass the ternary operator condition, and cause Infinity to be returned
        // if currentDollarCostAverage is 0
        Number(currentDollarCostAverage) ? 
        (currentCoinMarketPrice - currentDollarCostAverage!) / (currentDollarCostAverage!) : 
        null; 
      // Set the marketPriceAndProfitLossPercentage to be returned
      marketPriceAndProfitLossPercentage = {
        currentCoinMarketPrice,
        unrealisedProfitLossPercentage
      }
    }catch(err){
      if(err){
        console.log(`error found, possibly request payload data issue: ${JSON.stringify(err)}`);
      }else{
       // timeout
        console.log(`Timeout, please try again`);
      }
    }
    return marketPriceAndProfitLossPercentage;
  }
}