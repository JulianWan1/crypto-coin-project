import { Injectable, Logger } from "@nestjs/common";
import { Endpoints } from "src/endpoints/endpoints";
import { LiveCoinWatchSingleCoinRequest } from "src/models/coin-related.model";
import { liveCoinWatchAxios } from "src/utils/axios";

@Injectable()
export class CoinsLiveCoinWatchService {

  private logger = new Logger('CoinsLiveCoinWatchService')

  async getCurrentCoinMarketValue(coinCode: string){

    const singleCoinRequestBody: LiveCoinWatchSingleCoinRequest = {
      "currency": "USD",
      "code": `${coinCode}`,
      "meta": true
    }

    const response = await liveCoinWatchAxios.post(
      Endpoints.LiveCoinWatchSingleCoinEndpoint,
      singleCoinRequestBody
    );

    this.logger.log(`${coinCode} Current Market Price: ${JSON.stringify(response.data.rate)}`)

    return response.data;

  };
  
}
