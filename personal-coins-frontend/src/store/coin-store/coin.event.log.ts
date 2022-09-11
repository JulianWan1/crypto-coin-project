import { CoinEvent, CoinEventLog } from "@/models/table.model";
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
import { CoinEventUpdateRequestBody } from "@/models/api-related-model";

@Module({
  dynamic: true,
  name: "coin.event.log",
  namespaced: true,
  store: index,
})
export class CoinEventLogStore extends VuexModule {
  allSpecificCoinEvents: CoinEvent | null = null;

  isLoading = false;

  @Mutation
  mutateCoinEvent(payload: CoinEvent) {
    this.allSpecificCoinEvents = payload;
  }

  @Mutation
  mutateLoadingStatus(payload: boolean) {
    this.isLoading = payload;
  }

  @Action
  async getCoinEvent(coinName:string): Promise<void> {
    try {
      const allSpecificCoinEvents = await axios.get(`${Endpoints.Coins}/${coinName}`);
      const { data } = allSpecificCoinEvents;
      this.context.commit("mutateCoinEvent", data);
    } catch (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("data retrieval took too long, potential timeout");
      }
    }
  }

  @Action
  async updateSpecificCoinEvent(requestBody:CoinEventUpdateRequestBody):Promise<any>{
    if (this.isLoading) {
      return
    }
    await this.context.commit('mutateLoadingStatus', true);
    const {id} = requestBody;
    try {
      const response = await axios.patch(`${Endpoints.UpdateCoinEvent}/${id}`, requestBody)
      this.context.commit('mutateLoadingStatus', false);
      return response;
    }catch(error:any){
      if(error){
        this.context.commit('mutateLoadingStatus', false);
        return error.response.data
      }else {
        console.log("data update took too long, potential timeout");
        this.context.commit('mutateLoadingStatus', false);
      }
    }
  }
  
  @Action
  async deleteSpecificCoinEvent(selectedEventRowDetails:CoinEvent):Promise<any>{
    if (this.isLoading) {
      return
    }
    await this.context.commit('mutateLoadingStatus', true);
    const {id} = selectedEventRowDetails.coinEventLog[0];
    const {coinName} = selectedEventRowDetails;
    try {
      const response = await axios.delete(`${Endpoints.DeleteCoinOrCoinEvent}/${coinName}/${id}`)
      this.context.commit('mutateLoadingStatus', false);
      return response;
    }catch(error:any){
      if(error){
        this.context.commit('mutateLoadingStatus', false);
        return error.response.data
      }else {
        console.log("deletion of event took too long, potential timeout");
        this.context.commit('mutateLoadingStatus', false);
      }
    }
  }

}

export default getModule(CoinEventLogStore);
