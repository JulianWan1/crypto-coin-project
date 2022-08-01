<template>
  <div class="event-log-container">
    <div class="buttons-container">
      <div 
        class="event-selected-buttons"
        v-if="selectedEventRow"
        @click.stop
      >
        <b-button
          @click="changeModalStatus"
        >
          Update
        </b-button>
        <b-button>
          Delete
        </b-button>
      </div>
    </div>
    <div 
      class="update-coin-event-modal"
      @click.stop
    >
      <UpdateCoinEventModal
        :isActive="isUpdateCoinEventModalActive"
        :coinEventDetails="selectedEventRow"
        :coinName="coinName"
        @closeModal="changeModalStatusAndDeselectRow"
        @triggerUpdate="updateCoinEvent"
      />
    </div>
    <div
      class="confirm-update-event-modal"
      @click.stop
    >
      <UpdateCoinEventConfirmationModal
        :isActive="isUpdateCoinEventConfirmationModalActive"
        :updateMessage="updateConfirmationMessage"
        :eventId="confirmationEventId"
        @closeConfirmationModal="closeUpdateConfirmationModalAndOpenUpdateModal"
        @triggerUpdateConfirmation="confirmUpdateCoinEvent"
      />
    </div>
    <b-table
      :data="this.paginatedCoinEventLogBuySellOnly"
      :selected.sync="selectedEventRow"
      v-on-clickaway="selectedRowStatusMethod"
      focusable
      :sticky-header="true"
      height="300px"  
      class="table"
    >
      <b-table-column field="id" label="ID" v-slot="props">
        {{ props.row.id }}
      </b-table-column>
      <b-table-column field="eventType" label="Event" v-slot="props">
        {{ props.row.eventType === 0 ? 'Sell' : 'Buy' }}
      </b-table-column>
      <b-table-column field="buySellQuantity" label="Quantity" v-slot="props">
        {{ props.row.buyQuantity? props.row.buyQuantity : props.row.sellQuantity }}
      </b-table-column>
      <b-table-column field="aggregatePrice" label="Aggregate Price" v-slot="props">
        {{ props.row.aggregatePrice }}
      </b-table-column>
      <b-table-column field="marketPrice" label="Market Price" v-slot="props">
        {{ props.row.marketPrice }}
      </b-table-column>
      <b-table-column field="networkFee" label="Network Fee" v-slot="props">
        {{ props.row.networkFee }}
      </b-table-column>
      <b-table-column field="exchangePremium" label="Exchange Premium" v-slot="props">
        {{ props.row.exchangePremium }}
      </b-table-column>
      <b-table-column field="eventDate" label="Event Date" v-slot="props">
        {{ props.row.eventDate.toLocaleString() }}
      </b-table-column>
    </b-table>
    <b-pagination
      :total="totalEvents"
      :current="currentPage"
      :per-page="perPage"
      @change="onPageChange"
      style="height=10px"
    >
    </b-pagination>
    <b-select v-model="perPage">
      <option value="5">5 per page</option>
      <option value="10">10 per page</option>
      <option value="15">15 per page</option>
      <option value="20">20 per page</option>
    </b-select>
    <b-button
      v-if="successToast"
      label="Close Update Message"
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
import {Vue, Component, Watch, Prop} from 'vue-property-decorator'
import { CoinEventLog } from '../models/table.model';
import { CoinEventLogStore } from '../store/coin-store/coin.event.log';
import { coinStore } from '../store/coin-store/coin.store.index';
import { mixin as clickaway } from "vue-clickaway";
import UpdateCoinEventModal from './modals/UpdateCoinEventModal.vue';
import UpdateCoinEventConfirmationModal from './modals/UpdateCoinEventConfirmationModal.vue'
import { CoinModalFieldData } from '../models/form-data.model';
import { CoinEventUpdateRequestBody, CoinEventUpdateRequestBodyRelevantFields, UpdateModalFields } from '../models/api-related-model';
import { EventType } from '../enums/enums'
import { BNoticeComponent } from 'buefy/types/components';
import { failedToastMethod, successToastMethod } from '../utils/toasts'
import { convertFromCamelCaseToStartingUpperCaseWord } from '../utils/validation'

@Component({
  components: {
    UpdateCoinEventModal,
    UpdateCoinEventConfirmationModal
  },
  mixins: [ clickaway ]
})
export default class CoinEventLogTableComponent extends Vue {

  store:CoinEventLogStore = coinStore.coinEventLogStore;

  @Prop()
  coinName!: string;

  coinEventLogRetrieved: CoinEventLog[] = [];
  coinEventLogBuySellOnly: CoinEventLog[] = [];
  paginatedCoinEventLogBuySellOnly: CoinEventLog[] =[];
  selectedEventRow: CoinEventLog | null = null;
  totalEvents = 0;
  currentPage = 1;
  perPage = 5;
  isUpdateCoinEventModalActive = false;
  isUpdateCoinEventConfirmationModalActive = false;
  loadingStatus = false;
  requestBody: CoinEventUpdateRequestBody | null = null;
  proceedUpdateEvent: boolean|null = null;
  successToast: null | BNoticeComponent = null;
  confirmationEventId = 0;
  updateConfirmationMessage = ``;

  mounted() {
    this.getCoinEventLogTableData();
    this.selectedEventRow = null;
  }

  // Get all of the events for the table
  async getCoinEventLogTableData(){
    this.loadingStatus = true;
    await this.store.getCoinEvent(this.coinName);
    if(
      this.store && 
      this.store.allSpecificCoinEvents && 
      this.store.allSpecificCoinEvents.coinEventLog
    ){
      // Set coinEventLogRetrieved & coinEventLogBuySellOnly to empty string,
      // totalEvents to 0,
      // to reset them when getCoinEventLogTableData is being invoked
      // and to avoid the table from duplicating rows during an update
      this.coinEventLogRetrieved = [];
      this.coinEventLogBuySellOnly = [];
      this.totalEvents = 0;
      // Using concat to "copy" the coinEventLogRetrieved returned data from the store
      // Using spread operator works, but throws an error in docker (must have a '[Symbol.iterator]()' method that returns an iterator)
      this.coinEventLogRetrieved = this.coinEventLogRetrieved.concat(this.store.allSpecificCoinEvents.coinEventLog)
    }
    // Get all the required events for table only (all events except DCAEvents, buys and sells only)
    // Convert the eventDate from UTC to local date for the table UI purpose (otherwise user will be seeing the event date in UTC format)
    // Capture the totalEvents to be used for the pagination 
    for(let i = 0; i < this.coinEventLogRetrieved.length; i++){
      if(this.coinEventLogRetrieved[i].eventType!== 1){
        // convert UTC datetime to local datetime
        this.coinEventLogRetrieved[i].eventDate = new Date(this.coinEventLogRetrieved[i].eventDate);
        this.coinEventLogBuySellOnly.push(this.coinEventLogRetrieved[i]);
        this.totalEvents += 1;
      }
    }
    // Get the amount of data to be set in the table for pagination
    // e.g. 5 rows per page, hence take the first 5 from all of the required events list
    await this.loadPaginatedData();
    this.loadingStatus = false;
  }

  selectedRowStatusMethod(){
    this.selectedEventRow = null
  }

  @Watch('selectedEventRow')
  logSelectedStatus(){
    console.log(`Selected/Updated Event for ${this.coinName}: ${JSON.stringify(this.selectedEventRow)}`);
  }

  // Function whenever the current page is changed for the table
  onPageChange(currentPage:number){
    this.currentPage = currentPage;
    this.loadPaginatedData();
  }

  // Function to get the data for the table based on the custom pagination
  loadPaginatedData(){
    let startingIndex = ((this.currentPage - 1) * this.perPage);
    let endingIndex = (this.currentPage * this.perPage);
    this.paginatedCoinEventLogBuySellOnly =  this.coinEventLogBuySellOnly.slice(startingIndex, endingIndex);
  }

  // If the amount of logs per page changes, update the amount of data shown in the table
  @Watch('perPage')
  updatePerPage(){
    this.loadPaginatedData();
  }

  // Open and close the modal
  changeModalStatus(){
    this.isUpdateCoinEventModalActive = !this.isUpdateCoinEventModalActive;
  }

  // Close modal and deselect the selected row earlier
  changeModalStatusAndDeselectRow(){
    this.changeModalStatus()
    this.deselectRow()
  }

  // Deselect the selected row for update
  deselectRow(){
    this.selectedRowStatusMethod();
  }

  // Open and close the update confirmation modal
  changeConfirmationModalStatus(){
    this.isUpdateCoinEventConfirmationModalActive = !this.isUpdateCoinEventConfirmationModalActive;
  }

  // Close the update confirmation modal 
  // Reopen the update modal 
  // Clear the updateConfirmationMessage back to empty string
  closeUpdateConfirmationModalAndOpenUpdateModal(){
    this.isUpdateCoinEventConfirmationModalActive = !this.isUpdateCoinEventConfirmationModalActive;
    this.isUpdateCoinEventModalActive = !this.isUpdateCoinEventModalActive;
    this.updateConfirmationMessage = ``;
  }

  async updateCoinEvent(mainCoinModalDetails:CoinModalFieldData){
    // Get all the required data for the requestBody
    // First get all data from the current selected row
    // Then get all the data from the modal
    const {
      id,
      eventType,
      buyQuantity,
      sellQuantity,
      eventDate
    } = this.selectedEventRow as CoinEventLog
    const coinNameWithUpperCase = `${this.coinName[0].toUpperCase()}${this.coinName.slice(1)}`
    const marketPriceFromSelectedEventRow:number = this.selectedEventRow!.marketPrice as number;
    const exchangePremiumFromSelectedEventRow:number = this.selectedEventRow!.exchangePremium as number;
    const networkFeeFromSelectedEventRow:number = this.selectedEventRow!.networkFee as number;
    const {
      quantity,
      marketPrice,
      exchangePremium,
      networkFee,
      dateTime
    } = mainCoinModalDetails;
    // Use Object.assign to set up the requestBody by setting the fields that has undergone changes only
    // By setting '&&', it is stating that these will not return falsy values and will return the value at RHS
    // If the object property is null (meaning no changes between the selectedEventRow & mainCoinModalDetails), it will be skipped over
    // This leaves an object with properties that have undergone changes in the modal only (aside the id, eventType & coinName)
    // Doing this as this is a request body for a PATCH API call
    this.requestBody = Object.assign({},
      id && {id},
      coinNameWithUpperCase && {coinName: coinNameWithUpperCase},
      Number(eventType) === 2 ? {eventType} : {eventType: 0},
      eventType === EventType.BuyEventType ? 
        Number(quantity) === Number(buyQuantity) ? null : {buySellQuantity: quantity} 
      :
        Number(quantity) === Number(sellQuantity) ? null : {buySellQuantity: quantity},
      Number(marketPrice) === Number(marketPriceFromSelectedEventRow) ? null : {marketPrice},
      Number(networkFee) === Number(networkFeeFromSelectedEventRow) ? null : {networkFee},
      Number(exchangePremium) === Number(exchangePremiumFromSelectedEventRow) ? null : {exchangePremium},
      dateTime!.getTime() === eventDate!.getTime() ? null : {eventDate: dateTime} // compare date correctly using .getTime()
    )
    // If return error from BE, return it to FE, set error toast & message in modal and do not close modal
    // This is if the modal update returns any error from BE (e.g. the modal has the)
    console.log(`Submit to Store from table component: ${JSON.stringify(this.requestBody)}`);
    console.log(`Submit to store from table component (FULL MODAL DETAILS): ${JSON.stringify(mainCoinModalDetails)}`); 

    // Get the differences between the current selectedRow and the newly updated requestBody
    // Place them in buySellEventBeforeUpdateRelevantFields & buySellEventAfterUpdateRelevantFields objects respectively
    // If none (meaning buySellEventAfterUpdateRelevantFields is an empty object), modal doesn't close and returns updateFailure Toast for no changes 
    // Have to use UpdateModalFields interface which uses index signature as assigning the properties
    // using an ambiguous/general key in the loop will cause TS error 
    // (TS cannot predict what the field will be so set a standard property type through index signature)
    // (the ambiguous keys will actually be the fields from importantKeys array, except for buySellQuantity)
    const buySellEventBeforeUpdate:CoinEventLog = this.selectedEventRow!;
    let buySellEventBeforeUpdateRelevantFields: UpdateModalFields = {};
    let buySellEventAfterUpdateRelevantFields: UpdateModalFields = {};
    const importantKeys: string[] = ['buySellQuantity', 'marketPrice', 'networkFee', 'exchangePremium', 'eventDate']
    for(const key in this.requestBody){
      if(importantKeys.includes(key)){
        if(key === importantKeys[0]){
          buySellEventBeforeUpdate.buyQuantity ? 
            buySellEventBeforeUpdateRelevantFields.quantity = buySellEventBeforeUpdate.buyQuantity! 
            : 
            buySellEventBeforeUpdateRelevantFields.quantity = buySellEventBeforeUpdate.sellQuantity!;
          buySellEventAfterUpdateRelevantFields.quantity = this.requestBody.buySellQuantity! 
        }else{
          buySellEventBeforeUpdateRelevantFields[key] = buySellEventBeforeUpdate[key as keyof CoinEventLog]!,
          buySellEventAfterUpdateRelevantFields[key] = this.requestBody[key as keyof CoinEventUpdateRequestBodyRelevantFields]!
        }
      }
    }
    // Check if buySellEventAfterUpdateRelevantFields is empty (Meaning no updates were made by user)
    // If empty, don't close modal, and return error toast
    // Otherwise, open confirm update modal should open
    // set the confirmationEventId & confirmationMessage that will be passed to the confirm update modal
    if(Object.keys(buySellEventAfterUpdateRelevantFields).length === 0){
      const noUpdatesFoundMessage = 'No Updates Found, Please Update At Least ONE Field'
      failedToastMethod(noUpdatesFoundMessage);
    }else{
      this.confirmationEventId = id; 
      let confirmationMessageList: string[] = [];
      for(const key in buySellEventAfterUpdateRelevantFields){
        if(buySellEventBeforeUpdateRelevantFields[key]){
          let keyConvertedToUpperCaseWords = convertFromCamelCaseToStartingUpperCaseWord(key)
          let newMessage = `${keyConvertedToUpperCaseWords}: From ${buySellEventBeforeUpdateRelevantFields[key]} changed to ${buySellEventAfterUpdateRelevantFields[key]}`
          confirmationMessageList.push(newMessage)
        }
      }
      for(const message of confirmationMessageList){
        console.log(message)
        this.updateConfirmationMessage = this.updateConfirmationMessage.concat(message);
      }
      console.log(`Confirmation Message: ${this.updateConfirmationMessage}`)
      // Close the modal
      this.changeModalStatus();
      console.log(`isUpdateCoinEventModalActive: ${this.isUpdateCoinEventModalActive}`);
      // Open Confirm Update Modal
      this.changeConfirmationModalStatus();
      console.log(`isUpdateCoinEventConfirmationModalActive: ${this.isUpdateCoinEventConfirmationModalActive}`)
    }
  }

  // If user proceeds with the update event confirmation (may have error or will be successful)
  // then call the update API from the store and wait for the response
  async confirmUpdateCoinEvent(){
    // Start loading page
    this.loadingStatus = true;
    // Convert the requestBody's editable numerical field values to numbers (anything other than id, coinName, eventType & eventDate)
    let ignoredKeys = ['id', 'coinName', 'eventType', 'eventDate'];
    let convertedRequestBody: CoinEventUpdateRequestBody = this.requestBody as CoinEventUpdateRequestBody;
    for(const [key, value] of Object.entries(this.requestBody as CoinEventUpdateRequestBody)){
      if(!ignoredKeys.includes(key)){
        convertedRequestBody = {
          ...convertedRequestBody,
          [key]: Number(value)
        } 
      }
    }
    console.log(`confirmUpdateCoinEvent:${JSON.stringify(convertedRequestBody)}`)
    let response = await this.store.updateSpecificCoinEvent(convertedRequestBody)
    // Check if the update was successful or not
    await this.updateSuccessOrFailure(response, convertedRequestBody)
    // Stop loading page
    this.loadingStatus = false;
    // Clear the updateConfirmationMessage back to empty string
    this.updateConfirmationMessage = ``;
    console.log(`cleared updateConfirmationMessage post update: ${this.updateConfirmationMessage}`)
  }

  async updateSuccessOrFailure(response:any, requestBody:CoinEventUpdateRequestBody){
    // If update is successful (status 200) (which returns success response), toast, get the updated data from store, update the selectedEventRow and close modal
    // If update fails (status 400, 403, 500), return toast with error and keep modal open with error msg
    if(response && response.status === 200){
      console.log(response);
    // Retrieve before and after data for the toast & set the message for the success update event
    // Set the properties for buySellEventBeforeUpdateRelevantFields & buySellEventAfterUpdateRelevantFields
    // Have to use UpdateModalFields interface which uses index signature as assigning the properties
    // using an ambiguous/general key in the loop will cause TS error 
    // (TS cannot predict what the field will be so set a standard property type through index signature)
    // (the ambiguous keys will actually be the fields from importantKeys array, except for buySellQuantity)
      const buySellEventBeforeUpdate:CoinEventLog = response.data.buySellEventBeforeUpdate;
      const buySellEventAfterUpdate:CoinEventLog = response.data.buySellEventAfterUpdate;
      let buySellEventBeforeUpdateRelevantFields: UpdateModalFields = {};
      let buySellEventAfterUpdateRelevantFields: UpdateModalFields = {};
      const importantKeys: string[] = ['buySellQuantity', 'marketPrice', 'networkFee', 'exchangePremium', 'eventDate']
      for(const key in requestBody){
        if(importantKeys.includes(key)){
          if(key === importantKeys[0]){
            buySellEventBeforeUpdate.buyQuantity ? 
              buySellEventBeforeUpdateRelevantFields.quantity = buySellEventBeforeUpdate.buyQuantity! 
              : 
              buySellEventBeforeUpdateRelevantFields.quantity = buySellEventBeforeUpdate.sellQuantity!;
            buySellEventAfterUpdate.buyQuantity ?
              buySellEventAfterUpdateRelevantFields.quantity = buySellEventAfterUpdate.buyQuantity! 
              : 
              buySellEventAfterUpdateRelevantFields.quantity = buySellEventAfterUpdate.sellQuantity!
          }else{
            buySellEventBeforeUpdateRelevantFields[key] = buySellEventBeforeUpdate[key as keyof CoinEventLog]!,
            buySellEventAfterUpdateRelevantFields[key] = buySellEventAfterUpdate[key as keyof CoinEventLog]!
          }
        }
      }
      const successMessage = ` \n\
        Event ID #${this.selectedEventRow!.id!} Update Successful! \n\
        Before Update: \n\
        ${JSON.stringify(buySellEventBeforeUpdateRelevantFields)} \n\
        After Update: \n\
        ${JSON.stringify(buySellEventAfterUpdateRelevantFields)}
      `

      // Get the updated data from the store then proceed with other following functions
      await this.getCoinEventLogTableData()
      // Update the selected event row based on id 
      // (May not be necessary since after closing the modal, reselecting the event will return the updated event data)
      this.selectedEventRow = this.coinEventLogBuySellOnly.find(
        (event) => {
          if(event.id === this.selectedEventRow!.id){
            return event
          }
        }
      ) as CoinEventLog;
      // Deselect the event row
      this.deselectRow();
      // Close update confirmation modal
      this.changeConfirmationModalStatus();
      // Pop up the success toast (indefinite)
      this.successToast = successToastMethod(this.successToast, successMessage)
    }else{
      console.log(response);
      const errorMessage = response.message 
      // Close update confirmation modal and reopen the update modal
      this.closeUpdateConfirmationModalAndOpenUpdateModal();
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

.event-log-container{
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

</style>