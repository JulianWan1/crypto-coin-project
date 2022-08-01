import { Coin } from "@/models/table.model";
import {
  Module,
  Mutation,
  Action,
  getModule,
  VuexModule,
} from "vuex-module-decorators";
import { Endpoints } from "@/endpoints/endpoints";
import index from "..";
import { axios } from "@/utils/axios";
import { MakeBuySellCoinRequestParameter } from "@/models/api-related-model";

@Module({
  dynamic: true,
  name: "coin.list",
  namespaced: true,
  store: index,
})
export class CoinListStore extends VuexModule {
  portfolioCoinList: Array<Coin> = [];

  isLoading = false;

  @Mutation
  mutateList(payload: Array<Coin>) {
    this.portfolioCoinList = payload;
  }

  @Mutation
  mutateLoadingStatus(payload: boolean) {
    this.isLoading = payload;
  }

  @Action
  async getCoinList(): Promise<void> {
    try {
      const coinList = await axios.get(`${Endpoints.Coins}`);
      const { data } = coinList;
      this.context.commit("mutateList", data);
    } catch (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("data retrieval took too long, potential timeout");
      }
    }
  }

  @Action
  async makeBuySellCoinRequest({requestBody, selectedBuyOrSellOption}:MakeBuySellCoinRequestParameter): Promise<any> {
    if (this.isLoading) {
      console.log(`makeBuySellCoinRequest is loading: ${this.isLoading}`)
      return;
    }
    await this.context.commit('mutateLoadingStatus', true);
    console.log(`successfully mutateLoadingStatus: ${this.isLoading} `)
    const {coinName} = requestBody;
    const coinNameToLowerCase = coinName.toLowerCase();
    try {
      const response = await axios.post(`${Endpoints.Coins}/${selectedBuyOrSellOption}/${coinNameToLowerCase}`, requestBody)
      return response;
    }catch(error:any){
      if(error){
        return error.response.data
      }else {
        console.log("data update took too long, potential timeout");
      }
    }
  }

  @Action
  async setIsLoadingToFalse(){
    await this.context.commit('mutateLoadingStatus', false);
    console.log(`mutateLoadingStatus is set to ${this.isLoading}`)
  }

}

export default getModule(CoinListStore);
