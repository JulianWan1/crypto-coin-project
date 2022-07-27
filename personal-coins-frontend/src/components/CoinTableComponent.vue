<template>
  <div class="portfolio-container">
    <div class="buttons-container">
      <div 
        class="no-coin-selected-button"
        v-if="!selectedCoinRow"
      >
        <b-button>
          New Coin +
        </b-button>
      </div>
      <div 
        class="coin-selected-buttons"
        v-if="selectedCoinRow"
        @click.stop
      >
        <b-button>
          Buy/Sell
        </b-button>
        <b-button
          tag="router-link"
          :to="{ name: 'CoinEvents', params: {coinName:`${selectedCoinRow.coinName.toLowerCase()}`} }"
        >
          View Log
        </b-button>
        <b-button>
          Delete
        </b-button>
      </div>
    </div>
    <b-table
      :data="this.portfolioCoinList"
      :selected.sync="selectedCoinRow"
      :default-sort="['currentAmountOwned', 'desc']"
      v-on-clickaway="selectedRowStatusMethod"
      focusable
      class="table"
    >
      <b-table-column 
        field="id" 
        label="ID" 
        sortable 
        v-slot="props"
      >
        {{ props.row.id }}
      </b-table-column>
      <b-table-column 
        field="coinName" 
        label="Coin" 
        sortable 
        v-slot="props"
      >
        {{ props.row.coinName }}
      </b-table-column>
      <b-table-column
        field="currentAmountOwned"
        label="Curent Amount Owned"
        sortable
        v-slot="props"
      >
        {{ props.row.currentAmountOwned }}
      </b-table-column>
      <b-table-column
        field="currentCoinMarketPrice"
        label="Current Coin Market Price"
        v-slot="props"
      >
        {{ 
          props.row.currentCoinMarketPrice? 
          parseFloat(props.row.currentCoinMarketPrice.toFixed(5)): 'N/A'
        }}
      </b-table-column>
      <b-table-column
        field="dollarCostAverage"
        label="Dollar Cost Avg"
        v-slot="props"
      >
        {{ props.row.currentDollarCostAverage }}
      </b-table-column>
      <b-table-column
        field="dollarSoldAverage"
        label="Dollar Sold Avg"
        v-slot="props"
      >
        {{ props.row.dollarSoldAverage }}
      </b-table-column>
      <b-table-column field="totalBought" label="Total Bought" v-slot="props">
        {{ props.row.totalBought }}
      </b-table-column>
      <b-table-column field="totalSold" label="Total Sold" v-slot="props">
        {{ props.row.totalSold }}
      </b-table-column>
      <b-table-column
        field="unrealisedProfitLossPercentage"
        label="Unrealised Profit Loss Percentage"
        v-slot="props"
      >
        {{ 
          props.row.unrealisedProfitLossPercentage? 
          parseFloat((props.row.unrealisedProfitLossPercentage * 100).toFixed(3)) : `N/A`
        }}
      </b-table-column>
      <b-table-column
        field="realisedProfitLossPercentage"
        label="Realised Profit Loss Percentage (%)"
        v-slot="props"
      >
        {{ parseFloat((props.row.realisedProfitLossPercentage * 100).toFixed(3)) }}
      </b-table-column>
      <b-table-column
        field="lastBoughtAmount"
        label="Last Bought Amount"
        v-slot="props"
      >
        {{ props.row.lastBoughtAmount }}
      </b-table-column>
      <b-table-column
        field="lastBoughtDate"
        label="Last Bought Date"
        v-slot="props"
      >
        {{ props.row.lastBoughtDate.toLocaleString() }}
      </b-table-column>
      <b-table-column
        field="lastSoldAmount"
        label="Last Sold Amount"
        v-slot="props"
      >
        {{ props.row.lastSoldAmount? props.row.lastSoldAmount : 'N/A' }}
      </b-table-column>
      <b-table-column
        field="lastSoldDate"
        label="Last Sold Date"
        v-slot="props"
      >
        {{ props.row.lastSoldDate? props.row.lastSoldDate.toLocaleString() : 'N/A' }}
      </b-table-column>
    </b-table>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { coinStore } from "../store/coin-store/coin.store.index";
import { Coin } from "../models/table.model";
import { CoinListStore } from "../store/coin-store/coin.list";
import { LiveCoinWatchFunctions } from "../general-fe-functions/live-coin-watch-functions";
import { UnrealisedProfitLossPercentageCalculatorResponse } from "../models/api-related-model"
import { mixin as clickaway } from "vue-clickaway";

@Component({
  components: {},
  mixins: [ clickaway ] // set the v-on-clickaway functionality for the table's row (allow row to be deselected when clicking outside the table). Refer to vue clickaway library for more details
})

export default class CoinTableComponent extends Vue {
  store:CoinListStore = coinStore.coinListStore;
  initialPortfolioCoinList:Array<Coin> = [];
  portfolioCoinList: Array<Coin> = [];
  setAPICallTime: number = 1000 * 60 * 10 // milliseconds
  selectedCoinRow: Coin | null = null;
  liveCoinWatchFunctions = new LiveCoinWatchFunctions;
  
  async mounted() {
    await this.getPortfolioCoinTableData();
    console.log(`starting portfolioCoinList:${JSON.stringify(this.portfolioCoinList)}`);
    // call the function that calls the live coin watch single coin api every 10 minutes
    setInterval(
      async() => {
        await this.currentCoinMarketPriceRetriever(this.initialPortfolioCoinList)
        console.log(`portfolioCoinList after interval: ${JSON.stringify(this.portfolioCoinList)}`)
      },
      this.setAPICallTime
    );
    this.selectedCoinRow = null;
  }

  async getPortfolioCoinTableData(){
    // Trigger the store's function to get the portfolio's coins list 
    await this.store.getCoinList();
    // Populate the initialPortfolioCoinList variable
    this.initialPortfolioCoinList = this.store.portfolioCoinList;
    console.log(`retrieved initialPortfolioCoinList: `, (JSON.stringify(this.initialPortfolioCoinList)));
    // Apply the newly populated initialPortfolioCoinList to the currentCoinMarketPriceRetriever to get their respective current coin market price
    await this.currentCoinMarketPriceRetriever(this.initialPortfolioCoinList);
  }

  async currentCoinMarketPriceRetriever(portfolioCoinList:Coin[]){
    // Iterate through every coin in the list and set their respective currentCoinMarketPrice & unrealisedProfitLossPercentage
    // Also convert the lastBoughtDate & lastSoldDate from UTC to local time
    for(let i = 0; i < portfolioCoinList.length; i++){
      const marketPriceAndProfitLossPercentage: UnrealisedProfitLossPercentageCalculatorResponse = 
        await this.liveCoinWatchFunctions.unrealisedProfitLossPercentageCalculator(portfolioCoinList[i]);
      console.log(JSON.stringify(marketPriceAndProfitLossPercentage));
      const {currentCoinMarketPrice, unrealisedProfitLossPercentage} = marketPriceAndProfitLossPercentage;
      if(
        marketPriceAndProfitLossPercentage &&
        currentCoinMarketPrice &&
        unrealisedProfitLossPercentage
      ){
        portfolioCoinList[i] = {
          ...portfolioCoinList[i], 
          currentCoinMarketPrice,
          unrealisedProfitLossPercentage
        }
      }
      portfolioCoinList[i].lastBoughtDate = new Date(portfolioCoinList[i].lastBoughtDate);
      portfolioCoinList[i].lastSoldDate = portfolioCoinList[i].lastSoldDate !== null ? new Date(portfolioCoinList[i].lastSoldDate as Date) : null;
    }
    // set the portfolioCoinList to be used by the table
    // BIG NOTE: 
    // Weird issue where updating this.portfolioCoinList by using this.portfolioCoinList = portfolioCoinList instead of the spread operator
    // The currentCoinMarketPriceRetriever function when called will not return the changes to the table, 
    // despite the portfolioCoinList is updated with the new currentCoinMarketPrice & unrealisedProfitLossPercentage (only with spread operator will it work)
    // The getPortfolioCoinTableData however when called will update both the portfolioCoinList and the table
    this.portfolioCoinList = [...portfolioCoinList];
    console.log(`Newly updated portfolio coin list: ${JSON.stringify(this.portfolioCoinList)}`);
  }

  selectedRowStatusMethod(){
    this.selectedCoinRow = null
  }

  @Watch('selectedCoinRow')
  logSelectedStatus(){
    console.log(`Selected Portfolio Coin: ${JSON.stringify(this.selectedCoinRow)}`);
  }

}
</script>

<style lang="scss">
.portfolio-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 50px 90px 50px 90px;
  & .table {
    width: 100%;
    & .th-wrap {
      justify-content: center;
    }
  }
}

.buttons-container {
  display: flex;
  margin-bottom: 30px;
}

.svg {
  height:15px;
}
</style>
