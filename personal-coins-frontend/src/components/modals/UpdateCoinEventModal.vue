<template> 
  <b-modal 
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
    width="550px"
    class="modal"
  >
    <div
      class="modal__container"
    >
      <div class="modal__title">
        {{`${coinName[0].toUpperCase() + coinName.slice(1)}`}}
      </div>
      <div class="modal__sub-title">
        Event id #{{eventId}}: {{eventType}} Event 
      </div>
        <CoinDetailsModalComponent
          :updateEventModalType="true"
          :coinEventDetails="mainCoinModalDetails"
          :eventDateFromSelectedEvent="eventDateFromSelectedEvent"
          @retrievePartialCoinModalDetails="updateMainCoinModal"
        />
      <div class="modal__buttons">
        <b-button 
          class="submit-button"
          :disabled="updateButtonStatusIsDisabled"
          @click="submitDataToCoinEventLogTableComponent"
        >
          Update
        </b-button>
        <b-button 
          class="cancel-button"
          :disabled="loadingStatus"
          @click="closeModalFunction"
        >
          Cancel
        </b-button>
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

  @Prop({default:false})
  loadingStatus!:boolean;

  mainCoinModalDetails:CoinModalFieldData | null = null;

  eventId: number | null = null;

  eventType = ''

  eventDateFromSelectedEvent: Date | null = null;

  updateButtonStatusIsDisabled = false;

  // Whenever loading page is triggered, ensure that update button is disabled
  // When loading status is finished, set the update button to be active
  @Watch('loadingStatus')
  disableEnableSubmitButton(){
    if(this.loadingStatus){
      this.updateButtonStatusIsDisabled = true;
    }else{
      this.updateButtonStatusIsDisabled = false;
    }
  }

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

  // Send data to the CoinEventLogTableComponent
  submitDataToCoinEventLogTableComponent(){
    console.log(`Submitted Data to CoinEventLogTable: ${JSON.stringify(this.mainCoinModalDetails)}`)
    this.$emit('triggerUpdate', this.mainCoinModalDetails)
  }

  // Close modal when cancel or clicking outside modal
  closeModalFunction(){
    this.$emit('closeModal')
  }

}

</script>

<style lang="scss" scoped>
.modal{
  @include modalFontDefault(general);
  @include modalGeneralDefault();
  &__container{
    @include modalContainerDefault();
  }
  &__title{
    @include modalFontDefault(main-title);
  }
  &__sub-title{
    @include modalFontDefault(sub-title);
  }
  &__buttons{
    @include modalButtonsDefault();
  }
}
</style>