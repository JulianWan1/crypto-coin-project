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
import axios from "axios";

@Module({
  dynamic: true,
  name: "coin.list",
  namespaced: true,
  store: index,
})
export class CoinListStore extends VuexModule {
  list: Array<Coin> = [];

  @Mutation
  mutateList(payload: Array<Coin>) {
    this.list = payload;
  }

  @Action
  async getCoinList(): Promise<void> {
    try {
      const coinList = await axios.get("http://localhost:4000/coins"); // fix this axios and env files
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
}

export default getModule(CoinListStore);
