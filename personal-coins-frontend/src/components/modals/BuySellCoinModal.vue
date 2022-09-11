<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
    width="550px"
    class="modal"
  >
    <div class="modal__container">
      <div class="modal__title">
        {{selectedBuyOrSellOption === 'buy'? "Buy" : "Sell"}} {{coinName}}
      </div>
      <div class="modal__dropdown">
        <b-field label="Buy or Sell">
          <b-select
           v-model="selectedBuyOrSellOption"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </b-select>
        </b-field>
      </div>
      <CoinDetailsModalComponent
        @retrievePartialCoinModalDetails="updateMainCoinModal"
      />
      <div class="modal__buttons">
        <b-button 
          class="submit-button"
          :disabled="buySellButtonStatusIsDisabled"
          @click="submitBuySellCoinMethod"
        >
          {{selectedBuyOrSellOption === 'buy'? "Buy" : "Sell"}}
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
import { CoinModalFieldData } from '../../models/form-data.model';
import CoinDetailsModalComponent from './modal-subcomponent/CoinDetailsModalComponent.vue'

@Component({
  components:{ CoinDetailsModalComponent }
})

export default class BuySellCoinModal extends Vue {

  @Prop({ default: false })
  isActive!: boolean;

  @Prop()
  coinName!: string;

  @Prop()
  coinCode!: string;

  @Prop({default:false})
  loadingStatus!:boolean;

  buySellButtonStatusIsDisabled = true;
  selectedBuyOrSellOption = 'buy'; // Could use number 2 & 0 instead if required/better practice
  mainCoinModalDetails:CoinModalFieldData | null = null;

  // Whenever the modal is closed or opened, set:
  // 1. mainCoinModalDetails to null
  // 2. selectedBuyOrSellOption to be 'buy' option
  // 3. set the buySellButtonStatusIsDisabled to true
  // Important as to ensure the data within this modal is reset to this default setting
  @Watch('isActive')
  coinModalDetailsToNullMethod(){
    this.mainCoinModalDetails = null;
    this.selectedBuyOrSellOption = 'buy';
    this.buySellButtonStatusIsDisabled = true;
  }

  // Whenever loading page is triggered, ensure that buy/sell button is disabled
  // When loading status is finished, set the buy/sell button to be active
  @Watch('loadingStatus')
  disableEnableSubmitButton(){
    if(this.loadingStatus){
      this.buySellButtonStatusIsDisabled = true;
    }else{
      this.buySellButtonStatusIsDisabled = false;
    }
  }

  closeModalFunction(){
    this.$emit(`closeModal`)
  }

// Retrieve the updated modal data from the child component (CoinDetailsModalComponent)
// when an update is made on any of the child component's fields
// Update the mainCoinModalDetails with the contents of partialCoinModalDetails
// Sets the button for submission to be enabled/disabled if the field doesn't conform to the regex validation for integers
// (applies for integer fields only) 
  updateMainCoinModal(partialCoinModalDetails:CoinModalFieldData, isDisabled:boolean){
    this.mainCoinModalDetails = {...partialCoinModalDetails}
    this.buySellButtonStatusIsDisabled = isDisabled;
  }

  submitBuySellCoinMethod(){
    this.$emit(`triggerBuySellCoinEvent`, this.mainCoinModalDetails, this.selectedBuyOrSellOption);
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
  &__dropdown{
    @include modalDropdownFieldDefault();
  }
  &__buttons{
    @include modalButtonsDefault();
  }
}
</style>