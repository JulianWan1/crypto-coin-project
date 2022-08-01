<template>
  <div class="portfolio-container">
    <div class="buttons-container">
      <div 
        class="no-coin-selected-button"
        v-if="!selectedCoinRow"
      >
        <b-button

        >
          New Coin +
        </b-button>
      </div>
      <div 
        class="coin-selected-buttons"
        v-if="selectedCoinRow"
        @click.stop
      >
        <b-button
        @click="changeBuySellModalStatus"
        >
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
    <div
      class="buy-sell-coin-modal"
      @click.stop
    >
      <BuySellCoinModal
        :isActive="isBuySellModalActive"
        :coinName="selectedRowCoinName"
        :coinCode="selectedRowCoinCode"
        :loadingStatus="loadingStatus"
        @closeModal="changeBuySellModalStatusAndDeselectRow"
        @triggerBuySellCoinEvent="submitBuySellCoinEvent"
      />
    </div>
    <b-table
      :data="this.portfolioCoinList"
      :selected.sync="selectedCoinRow"
      :default-sort="['currentAmountOwned', 'desc']"
      v-on-clickaway="deselectRowMethod"
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
    <b-button
      v-if="successToast"
      label="Close Buy/Sell Message"
      type="is-danger"
      @click="closeToast"
    />
    <div 
      class="loading-screen"
      @click.stop
    >
      <b-loading 
        v-model="loadingStatus" 
      >
      </b-loading>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { coinStore } from "../store/coin-store/coin.store.index";
import { Coin } from "../models/table.model";
import { CoinListStore } from "../store/coin-store/coin.list";
import { LiveCoinWatchFunctions } from "../general-fe-functions/live-coin-watch-functions";
import { BuySellCreateCoinRequestBody, MakeBuySellCoinRequestParameter, UnrealisedProfitLossPercentageCalculatorResponse } from "../models/api-related-model"
import BuySellCoinModal from '../components/modals/BuySellCoinModal.vue'
import { mixin as clickaway } from "vue-clickaway";
import { CoinModalFieldData } from "../models/form-data.model";
import { failedToastMethod, successToastMethod } from "../utils/toasts";
import { BNoticeComponent } from "buefy/types/components";

@Component({
  components: {
    BuySellCoinModal
  },
  mixins: [ clickaway ] // set the v-on-clickaway functionality for the table's row (allow row to be deselected when clicking outside the table). Refer to vue clickaway library for more details
})

export default class CoinTableComponent extends Vue {
  store:CoinListStore = coinStore.coinListStore;
  initialPortfolioCoinList:Array<Coin> = [];
  portfolioCoinList: Array<Coin> = [];
  setAPICallTime: number = 1000 * 60 * 10 // milliseconds
  selectedCoinRow: Coin | null = null;
  selectedRowCoinName = 'placeHolderCoinName';
  selectedRowCoinCode = 'placeHolderCoinCode';
  liveCoinWatchFunctions = new LiveCoinWatchFunctions;
  isBuySellModalActive = false;
  loadingStatus = false;
  successToast: null | BNoticeComponent = null;
  
  async mounted() {
    // Open loading screen while waiting for portfolio table to be populated
    this.loadingStatus = true;
    await this.getPortfolioCoinTableData();
    // Once retrieved the table data, stop loading screen
    this.loadingStatus = false;
    console.log(`starting portfolioCoinList:${JSON.stringify(this.portfolioCoinList)}`);
    // Call the function that calls the live coin watch single coin api every 10 minutes
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

  deselectRowMethod(){
    this.selectedCoinRow = null
  }

  @Watch('selectedCoinRow')
  setSelectedCoinRow(){
    console.log(`Selected Portfolio Coin: ${JSON.stringify(this.selectedCoinRow)}`);
    if(this.selectedCoinRow){
      this.selectedRowCoinName = this.selectedCoinRow.coinName;
      this.selectedRowCoinCode = this.selectedCoinRow.coinCode;
    }else{
      this.selectedRowCoinName = 'placeHolderCoinName';
      this.selectedRowCoinCode = 'placeHolderCoinCode';
    }
  }

  // Close modal 
  // Set the isLoading state from true to false
  changeBuySellModalStatus(){
    this.isBuySellModalActive = !this.isBuySellModalActive
    this.store.setIsLoadingToFalse();
  }

  // Close the modal
  // and deselect selected coin row
  changeBuySellModalStatusAndDeselectRow(){
    this.changeBuySellModalStatus();
    this.deselectRowMethod();
  }

  // To make the submission of buy/sell coin event to API in store after making the buy/sell from modal
  async submitBuySellCoinEvent(mainCoinModalDetails:CoinModalFieldData, selectedBuyOrSellOption:string){
    // Open loading screen
    this.loadingStatus = true;
    console.log(`submitBuySellCoinEvent's coinName & coinCode ${this.selectedRowCoinName}, ${this.selectedRowCoinCode}`)
    console.log(`mainCoinModalDetails from submitBuySellCoinEvent: ${JSON.stringify(mainCoinModalDetails)}`)
    // Set the requestBody that is to be sent to the API in the store
    const{
      quantity,
      marketPrice,
      exchangePremium,
      networkFee,
      dateTime
    } = mainCoinModalDetails;
    const requestBody: BuySellCreateCoinRequestBody = {
      coinName: this.selectedRowCoinName,
      coinCode: this.selectedRowCoinCode,
      buySellQuantity: Number(quantity),
      marketPrice: Number(marketPrice),
      networkFee: Number (networkFee),
      exchangePremium: Number(exchangePremium),
      buySellDate: dateTime as Date
    }

    // Set the params to be sent to makeBuySellCoinRequest
    const makeBuySellCoinRequestParams: MakeBuySellCoinRequestParameter = {
      requestBody, 
      selectedBuyOrSellOption
    };

    // Call the API with the requestBody and the selectedBuyOrSellOptions and get response
    const buySellCoinResponse = await this.store.makeBuySellCoinRequest(makeBuySellCoinRequestParams);

    // Check if response is not undefined & returns success or failure
    if(buySellCoinResponse){
      await this.buySellCoinSuccessOrFailure(buySellCoinResponse);
    }else{
      console.log(`no response, meaning it is still loading boyz`)
    }
  }

  async buySellCoinSuccessOrFailure(response:any){
    // If update is successful (status 200) (which returns success response), toast, get the updated data from store, update the selectedEventRow and close modal
    // If update fails (status 400, 403, 500), return toast with error and keep modal open with error msg
    if(response && response.status === 201){
      console.log(response);
      // Retrieve the data of the buy sell event and set the message for it
      const buyOrSellString:string = response.data.latestBuySellEvent.buyQuantity? 'Buy' : 'Sell';
      const buyOrSellAmountString:number = response.data.latestBuySellEvent.buyQuantity? 
        Number(response.data.latestBuySellEvent.buyQuantity) : 
        Number(response.data.latestBuySellEvent.sellQuantity);
      const buyOrSellEventDate:string = new Date(response.data.latestBuySellDate).toLocaleString();
      const successMessage = `${buyOrSellString} of ${buyOrSellAmountString} ${this.selectedRowCoinName} has been successfully made on ${buyOrSellEventDate}`
      // Get the updated coin data from the store then proceed with other following functions
      await this.getPortfolioCoinTableData();
      // Deselect the coin row
      this.deselectRowMethod();
      // Close buy/sell coin modal
      this.changeBuySellModalStatus();
      // Close loading screen
      this.loadingStatus = false;
      // Pop up the success toast (indefinite)
      this.successToast = successToastMethod(this.successToast, successMessage)
    }else{
      console.log(response);
      // Close loading screen
      this.loadingStatus = false;
      const errorMessage = response.message 
      // Pop up the failure toast 
      failedToastMethod(errorMessage);
    }
  }

  // To close the update success toast when the toast appears
  closeToast(){
    if(this.successToast){
      this.successToast.close();
      this.successToast = null;
    }
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
