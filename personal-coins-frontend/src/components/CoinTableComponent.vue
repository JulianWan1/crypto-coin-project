<template>
  <div class="table__container">
    <div class="table__buttons">
      <div 
        class="table__buttons__no-coin-selected-button"
        v-if="!selectedCoinRow"
      >
        <b-button
          @click="changeAddNewCoinModalStatus"
          class="button__new-coin"
        >
          New Coin +
        </b-button>
      </div>
      <div 
        class="table__buttons__coin-selected-buttons"
        v-if="selectedCoinRow"
        @click.stop
      >
        <b-button
        @click="changeBuySellModalStatus"
        class="button__buy-sell"
        >
          Buy/Sell
        </b-button>
        <b-button
          tag="router-link"
          :to="{ name: 'CoinEvents', params: {coinName:`${selectedCoinRow.coinName.toLowerCase()}`} }"
          class="button__view-log"
        >
          View Log
        </b-button>
        <b-button
        @click="changeDeleteCoinModalStatus"
        class="button__delete"
        >
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
        :loadingStatus="loadingStatus"
        :coinName="selectedRowCoinName"
        :coinCode="selectedRowCoinCode"
        @closeModal="changeBuySellModalStatusAndDeselectRow"
        @triggerBuySellCoinEvent="submitBuySellCoinEvent"
      />
    </div>
    <div
      class="add-new-coin-modal"
      @click.stop
    >
      <AddNewCoinModal
        :isActive="isAddNewCoinModalActive"
        :loadingStatus="loadingStatus"
        :listOfExistingCoins="coinsAlreadyBought"
        @closeModal="changeAddNewCoinModalStatus"
        @triggerAddNewCoinEvent="submitAddNewCoinEvent"
      />
    </div>
    <div
      class="delete-coin-modal"
      @click.stop
    >
      <DeleteCoinModal
        :isActive="isDeleteCoinModalActive"
        :loadingStatus="loadingStatus"
        :coinName="selectedRowCoinName"        
        @closeModal="changeDeleteCoinModalStatusAndDeselectRow"
        @triggerDeleteCoinEvent="submitCoinDeletionEvent"
      />
    </div>
    <b-table
      :data="this.portfolioCoinList"
      :selected.sync="selectedCoinRow"
      :default-sort="['currentAmountOwned', 'desc']"
      v-on-clickaway="deselectRowMethod"
      focusable
      class="table__table"
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
        {{ props.row.currentAmountOwned.toFixed(6) }}
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
        label="Unrealised Profit Loss Percentage (%)"
        v-slot="props"
        :td-attrs="unrealisedProfitLossPercentageTextColour"
      >
        {{ 
          props.row.unrealisedProfitLossPercentage ? 
          parseFloat((props.row.unrealisedProfitLossPercentage * 100).toFixed(3)) : `N/A`
        }}
      </b-table-column>
      <b-table-column
        field="realisedProfitLossPercentage"
        label="Realised Profit Loss Percentage (%)"
        v-slot="props"
        :td-attrs="realisedProfitLossPercentageTextColour"
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
      label="Close Message"
      type="is-danger"
      @click="closeToast"
      v-on-clickaway="closeToast"
      class="table__toast-button"
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
import BuySellCoinModal from '../components/modals/BuySellCoinModal.vue';
import AddNewCoinModal from '../components/modals/AddNewCoinModal.vue';
import DeleteCoinModal  from "./modals/DeleteCoinModal.vue";
import { mixin as clickaway } from "vue-clickaway";
import { CoinModalFieldData } from "../models/form-data.model";
import { failedToastMethod, successToastMethod } from "../utils/toasts";
import { BNoticeComponent } from "buefy/types/components";

@Component({
  components: {
    AddNewCoinModal,
    BuySellCoinModal,
    DeleteCoinModal
  },
  mixins: [ clickaway ] // set the v-on-clickaway functionality for the table's row (allow row to be deselected when clicking outside the table). Refer to vue clickaway library for more details
})

export default class CoinTableComponent extends Vue {
  store:CoinListStore = coinStore.coinListStore;
  initialPortfolioCoinList:Array<Coin> = [];
  portfolioCoinList: Array<Coin> = [];
  setAPICallTime: number = 1000 * 60 * 10 // milliseconds
  selectedCoinRow: Coin | null = null;
  selectedRowCoinName = '';
  selectedRowCoinCode = '';
  liveCoinWatchFunctions = new LiveCoinWatchFunctions;
  isBuySellModalActive = false;
  isAddNewCoinModalActive = false;
  isDeleteCoinModalActive = false;
  coinsAlreadyBought:string[] = [];
  loadingStatus = false;
  successToast: null | BNoticeComponent = null;
  
  async mounted() {
    // Open loading screen while waiting for portfolio table to be populated
    this.loadingStatus = true;
    await this.getPortfolioCoinTableData();
    // Once retrieved the table data, stop loading screen
    this.loadingStatus = false;
    // Call the function that calls the live coin watch single coin api every 10 minutes
    setInterval(
      async() => {
        await this.currentCoinMarketPriceRetriever(this.initialPortfolioCoinList)
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
    // Set the coinsAlreadyBought back to an empty string array 
    // (this will help retrigger the watcher on listOfExistingCoins prop in AddNewCoinModal to reset availableCoinOptionsList within it)
    this.coinsAlreadyBought = [];
    // Get all of the names of coins that have been bought and set it to coinsAlreadyBought list
    for(let i = 0; i < this.initialPortfolioCoinList.length ;i++){
      this.coinsAlreadyBought.push(this.initialPortfolioCoinList[i].coinName);
    }
    // Apply the newly populated initialPortfolioCoinList to the currentCoinMarketPriceRetriever to get their respective current coin market price
    await this.currentCoinMarketPriceRetriever(this.initialPortfolioCoinList);
  }

  async currentCoinMarketPriceRetriever(portfolioCoinList:Coin[]){
    // Iterate through every coin in the list and set their respective currentCoinMarketPrice & unrealisedProfitLossPercentage
    // Also convert the lastBoughtDate & lastSoldDate from UTC to local time
    // convert the CurrentAmountOwned values for each coin to be number type 
    // (to ensure the default sorting of the current amount owned column will sort based on numerical value rather than on string basis)
    for(let i = 0; i < portfolioCoinList.length; i++){
      const marketPriceAndProfitLossPercentage: UnrealisedProfitLossPercentageCalculatorResponse = 
        await this.liveCoinWatchFunctions.unrealisedProfitLossPercentageCalculator(portfolioCoinList[i]);
      const {currentCoinMarketPrice, unrealisedProfitLossPercentage} = marketPriceAndProfitLossPercentage;
      if(
        marketPriceAndProfitLossPercentage &&
        currentCoinMarketPrice
      ){
        portfolioCoinList[i] = {
          ...portfolioCoinList[i], 
          currentCoinMarketPrice,
          unrealisedProfitLossPercentage
        }
      }
      portfolioCoinList[i].lastBoughtDate = new Date(portfolioCoinList[i].lastBoughtDate);
      portfolioCoinList[i].lastSoldDate = portfolioCoinList[i].lastSoldDate !== null ? new Date(portfolioCoinList[i].lastSoldDate as Date) : null;
      portfolioCoinList[i].currentAmountOwned = Number(portfolioCoinList[i].currentAmountOwned!);
    }
    // set the portfolioCoinList to be used by the table
    // BIG NOTE: 
    // Weird issue where updating this.portfolioCoinList by using this.portfolioCoinList = portfolioCoinList instead of the spread operator
    // The currentCoinMarketPriceRetriever function when called will not return the changes to the table, 
    // despite the portfolioCoinList is updated with the new currentCoinMarketPrice & unrealisedProfitLossPercentage (only with spread operator will it work)
    // The getPortfolioCoinTableData however when called will update both the portfolioCoinList and the table
    this.portfolioCoinList = [...portfolioCoinList];
  }

  deselectRowMethod(){
    this.selectedCoinRow = null
  }

  @Watch('selectedCoinRow')
  setSelectedCoinRow(){
    if(this.selectedCoinRow){
      this.selectedRowCoinName = this.selectedCoinRow.coinName;
      this.selectedRowCoinCode = this.selectedCoinRow.coinCode;
    }
    // else{
    //   // NEED TO CHECK THIS BEHAVIOUR (CAUSING A UI BUG WHERE WHEN CLOSING MODAL, COINNAME OR CODE GETS REPLACED WITH THIS FOR A SECOND)
    //   this.selectedRowCoinName = 'placeHolderCoinName';
    //   this.selectedRowCoinCode = 'placeHolderCoinCode';
    // }
  }

  // 1. Functions for buy/sell Modal

  // 1.1 Close buy sell modal 
  // Set the isLoading state from true to false
  changeBuySellModalStatus(){
    this.isBuySellModalActive = !this.isBuySellModalActive;
    this.store.setIsLoadingToFalse();
  }

  // 1.2 Close the buy sell modal
  // and deselect selected coin row
  changeBuySellModalStatusAndDeselectRow(){
    this.changeBuySellModalStatus();
    this.deselectRowMethod();
  }

  // 1.3 To make the submission of buy/sell coin event to API in store after making the buy/sell from modal
  async submitBuySellCoinEvent(mainCoinModalDetails:CoinModalFieldData, selectedBuyOrSellOption:string){
    // Open loading screen
    this.loadingStatus = true;
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
    }
  }

  // 1.4 Check Buy/Sell Submission Response
  async buySellCoinSuccessOrFailure(response:any){
    // If update is successful (status 200) (which returns success response), toast, get the updated data from store, update the selectedEventRow and close modal
    // If update fails (status 400, 403, 500), return toast with error and keep modal open with error msg
    if(response && response.status === 201){
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
      // Close loading screen
      this.loadingStatus = false;
      const errorMessage = response.message 
      // Pop up the failure toast 
      failedToastMethod(errorMessage);
    }
  }

  // 2. Functions for Add New Coin Modal

  // 2.1 Close Add New Coin Modal 
  // Set the isLoading state from true to false
  changeAddNewCoinModalStatus(){
    this.isAddNewCoinModalActive = !this.isAddNewCoinModalActive;
    this.store.setIsLoadingToFalse();
  }

  // 2.2 Submit New Coin Addition
    async submitAddNewCoinEvent(mainCoinModalDetails:CoinModalFieldData, selectedCoinOption:Partial<BuySellCreateCoinRequestBody>){
    // Open loading screen
    this.loadingStatus = true;
    // Set the requestBody that is to be sent to the API in the store
    const{
      quantity,
      marketPrice,
      exchangePremium,
      networkFee,
      dateTime
    } = mainCoinModalDetails;
    const requestBody: BuySellCreateCoinRequestBody = {
      coinName: selectedCoinOption.coinName!,
      coinCode: selectedCoinOption.coinCode!,
      buySellQuantity: Number(quantity),
      marketPrice: Number(marketPrice),
      networkFee: Number (networkFee),
      exchangePremium: Number(exchangePremium),
      buySellDate: dateTime as Date
    }

    // Call the API with the requestBody and the selectedBuyOrSellOptions and get response
    const addNewCoinResponse = await this.store.makeAddNewCoinRequest(requestBody);

    // Check if response is not undefined & returns success or failure
    if(addNewCoinResponse){
      await this.addNewCoinSuccessOrFailure(addNewCoinResponse);
    }
  }

  // 2.3 Check New Coin Addition Submission Response
  async addNewCoinSuccessOrFailure(response:any){
    // If submission is successful (status 201) (which returns success response), toast, 
    // If submission fails (status 400, 403, 500), return toast with error and keep modal open with error msg
    if(response && response.status === 201){
      // Retrieve the data of the add new coin event and set the message for it
      const newCoinName:string = response.data.latestCoin.coinName;
      const addNewCoinEventDate:string = new Date(response.data.latestCoinAddedDate).toLocaleString();
      const successMessage = `${newCoinName} has been successfully added to portfolio on ${addNewCoinEventDate}!`
      // Get the updated coin data (to get the newly added coin) from the store then proceed with other following functions
      await this.getPortfolioCoinTableData();
      // Close add new coin modal
      this.changeAddNewCoinModalStatus();
      // Close loading screen
      this.loadingStatus = false;
      // Pop up the success toast (indefinite)
      this.successToast = successToastMethod(this.successToast, successMessage)
    }else{
      // Close loading screen
      this.loadingStatus = false;
      const errorMessage = response.message 
      // Pop up the failure toast 
      failedToastMethod(errorMessage);
    }
  }

  // 3. Functions for Delete Coin Modal

    // 3.1 Close delete coin modal 
  // Set the isLoading state from true to false
  changeDeleteCoinModalStatus(){
    this.isDeleteCoinModalActive = !this.isDeleteCoinModalActive;
    this.store.setIsLoadingToFalse();
  }

  // 3.2 Close the delete coin modal
  // and deselect selected coin row
  changeDeleteCoinModalStatusAndDeselectRow(){
    this.changeDeleteCoinModalStatus();
    this.deselectRowMethod();
  }

  // 3.3 Submit Coin Deletion through Store 
  async submitCoinDeletionEvent(){
    // Only need to use the selectedRow's coinName (in lowercase)
    this.loadingStatus = true;

    const deleteCoinResponse = await this.store.makeDeleteCoinRequest(this.selectedRowCoinName);

    // Check if response is not undefined & returns success or failure
    if(deleteCoinResponse){
      await this.deleteCoinResponseSuccessOrFailure(deleteCoinResponse);
    }
  }
  // 3.4 Check Coin Deletion Response
  async deleteCoinResponseSuccessOrFailure(response:any){
    if(response && response.status === 200){
      const successMessage = `${this.selectedRowCoinName} has been deleted from portfolio`
      // Get the updated coin data from the store then proceed with other following functions
      await this.getPortfolioCoinTableData();
      // Deselect the coin row
      this.deselectRowMethod();
      // Close buy/sell coin modal
      this.changeDeleteCoinModalStatus();
      // Close loading screen
      this.loadingStatus = false;
      // Pop up the success toast (indefinite)
      this.successToast = successToastMethod(this.successToast, successMessage)
    }else{
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

  // Methods that deals with dynamic table text colour for:
  // - unrealised profit loss percentage
  unrealisedProfitLossPercentageTextColour(row:any, column:any){
    if(column.label === 'Unrealised Profit Loss Percentage (%)'){
      return row.unrealisedProfitLossPercentage && row.unrealisedProfitLossPercentage == 0 ? 
        {style: {color: 'white'}} : 
        row.unrealisedProfitLossPercentage && row.unrealisedProfitLossPercentage < 0 ? 
          {style: {color: 'red'}} : 
          {style: {color: 'springgreen'}}
    }
  }
  // - realised profit loss percentage
  realisedProfitLossPercentageTextColour(row:any, column:any){
    if(column.label === 'Realised Profit Loss Percentage (%)'){
      return row.realisedProfitLossPercentage && row.realisedProfitLossPercentage == 0 ? 
        {style: {color: 'white'}} : 
        row.realisedProfitLossPercentage && row.realisedProfitLossPercentage < 0 ? 
          {style: {color: 'red'}} : 
          {style: {color: 'springgreen'}}
    }
  }
}
</script>

<style lang="scss" scoped>
.table {
  &__container{
    @include tableContainer();
  }
  &__buttons{
    @include coinTableButtonsDefault();
  }
  &__table {
    @include tableDefault();
  }
  &__toast-button{
    @include toastButtonDefault();
  }
}
</style>
