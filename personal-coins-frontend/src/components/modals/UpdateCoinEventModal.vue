<template> 
  <b-modal 
    :active="isActive"
    :can-cancel="['escape', 'outside']"
    :on-cancel="closeModalFunction"
  >
    <div
      class="update-coin-event-modal-container"
    >
      <div class="coin-name">
        {{coinName.toUpperCase()}}
      </div>
      <div class="event-details">
        Event id #{{eventId}}: {{eventType}} Event 
      </div>
      <div class="coin-details">
        <CoinDetailsModalComponent
          :coinEventDetails="mainCoinModalDetails"
          :updateEventModalType="true"
          :eventDateFromSelectedEvent="eventDateFromSelectedEvent"
          @retrievePartialCoinModalDetails="updateMainCoinModal"
        />
      </div>
      <div class="modal-buttons">
        <button 
          class="update-button"
          :disabled="updateButtonStatusIsDisabled"
          @click="convertAndSubmitData"
        >
          Update
        </button>
        <button 
          class="cancel-button"
          @click="closeModalFunction"  
        >
          Cancel
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { CoinModalFieldData } from '../../models/form-data.model'
import { CoinEventLog } from '../../models/table.model';
import CoinDetailsModalComponent from './modal-subcomponent/CoinDetailsModalComponent.vue'

@Component({
  components:{
    CoinDetailsModalComponent
  }
})

export default class UpdateCoinEventModal extends Vue {

  @Prop({ default: false })
  isActive!: boolean;

  @Prop()
  coinEventDetails!: CoinEventLog;

  @Prop()
  coinName!: string;

  mainCoinModalDetails:CoinModalFieldData | null = null;

  eventId: number | null = null;

  eventType = ''

  eventDateFromSelectedEvent: Date | null = null;

  updateButtonStatusIsDisabled = false;

// Set the modal data to be of the selected row from table
// To be sent to the coinDetailsModalComponent as prop
  @Watch('coinEventDetails')
  retrieveSelectedCoinEvent(){
    if(this.coinEventDetails){
      const { 
        id,
        eventType, 
        buyQuantity, 
        sellQuantity,
        marketPrice,
        networkFee,
        exchangePremium,
        eventDate
      } = this.coinEventDetails
      this.mainCoinModalDetails = {
        marketPrice,
        quantity: eventType === 2 ? buyQuantity : sellQuantity,  
        networkFee,
        exchangePremium,
        dateTime: eventDate 
      }
      this.eventId = id;
      this.eventType = eventType === 2 ? 'Buy' : 'Sell'
      this.eventDateFromSelectedEvent = eventDate;
    }else{
      this.mainCoinModalDetails = null;
    }

    console.log(`From UpdateCoinEventModal: ${JSON.stringify(this.mainCoinModalDetails)}`)
  }

// Retrieve the updated modal data from the child component (CoinDetailsModalComponent)
// when an update is made on any of the child component's fields
// Update the mainCoinModalDetails with the contents of partialCoinModalDetails
// Sets the button for submission to be enabled/disabled if the field doesn't conform to the regex validation for integers
// (applies for integer fields only) 
  updateMainCoinModal(partialCoinModalDetails:CoinModalFieldData, isDisabled:boolean){
    this.mainCoinModalDetails = {...partialCoinModalDetails}
    this.updateButtonStatusIsDisabled = isDisabled;
    console.log(`mainCoinModalDetails from updateCoinEventModal: ${JSON.stringify(this.mainCoinModalDetails)}`)
  }

// Convert all numerical fields to number type
  convertAndSubmitData(){
    // const ignoredKeys = ['dateTime', 'coinType', 'buySellEvent'];
    // let newData: CoinModalFieldData = this.mainCoinModalDetails as CoinModalFieldData;

    // for (const [key, value] of Object.entries(
    //   this.mainCoinModalDetails as CoinModalFieldData,
    // )) {
    //   if (!ignoredKeys.includes(key)) {
    //     newData = {
    //       ...newData,
    //       [key]: Number(value),
    //     };
    //   }
    // }
    // this.mainCoinModalDetails = {
    //   ...this.mainCoinModalDetails,
    //   ...newData,
    // };
    console.log(`Submitted Data to CoinEventLogTable: ${JSON.stringify(this.mainCoinModalDetails)}`)
    this.$emit('triggerUpdate', this.mainCoinModalDetails)
  }

  // Close modal when cancel or clicking outside modal
  closeModalFunction(){
    this.$emit('closeModal')
  }

}

</script>

<style lang="scss">
  .update-coin-event-modal-container{
    display:flex;
    flex-direction: column;
    background-color: white;
  } 
</style>