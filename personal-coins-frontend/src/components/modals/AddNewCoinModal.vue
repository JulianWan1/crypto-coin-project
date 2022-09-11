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
        Add New Coin
      </div>
      <div 
        class="modal__dropdown"
        v-if="selectedCoinOptionName"
      >
        <b-field label="Coin Name">
          <b-select
           v-model="selectedCoinOptionName"
           :disabled="coinOptionDropdownDisabled"
          >
            <option
              v-for="option in availableCoinOptionsList"
              :value="option.coinName"
              :key="option.coinName"
            >
              {{option.coinName}}
            </option>
          </b-select>
        </b-field>
      </div>
      <div 
        class="modal__no-dropdown-available"
        v-if="!selectedCoinOptionName"
      >
        No New Coins Available for Purchase
      </div>
      <CoinDetailsModalComponent
        @retrievePartialCoinModalDetails="updateMainCoinModal"
      />
      <div class="modal__buttons">
        <b-button 
          class="submit-button"
          :disabled="submitAddCoinButtonStatusIsDisabled"
          @click="addNewCoinMethod"
        >
          Add
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
import {Vue, Prop, Component, Watch} from 'vue-property-decorator'
import { BuySellCreateCoinRequestBody } from '../../models/api-related-model';
import { CoinModalFieldData } from '../../models/form-data.model';
import CoinDetailsModalComponent from './modal-subcomponent/CoinDetailsModalComponent.vue';

@Component({
  components:{
    CoinDetailsModalComponent
  }
})

export default class AddNewCoinModal extends Vue {

  @Prop({ default: false })
  isActive!: boolean;

  // Get the list of existing coins from the CoinTableComponent
  // to ensure that the dropdown will only show coins that are not bought
  @Prop()
  listOfExistingCoins!: string[];

  @Prop({default:false})
  loadingStatus!:boolean;

  // Set a list of coins to choose from, for now its these 4 only
  // IMPORTANT: Needs to conform to the coin's name and code from LiveCoinWatch
  // Maybe get the coinName and coinCode from livecoinwatch API, maybe not?
  coinOptionsList: Partial<BuySellCreateCoinRequestBody>[] = [
    {coinName:'Bitcoin',coinCode:'BTC'},
    {coinName:'Ethereum',coinCode:'ETH'},
    {coinName:'Cardano',coinCode:'ADA'},
    {coinName:'Solana',coinCode:'SOL'},
  ]
  availableCoinOptionsList: Partial<BuySellCreateCoinRequestBody>[] = [];
  selectedCoinOptionName = '';
  selectedCoinOption:Partial<BuySellCreateCoinRequestBody> | null = null;
  coinOptionDropdownDisabled = false;
  submitAddCoinButtonStatusIsDisabled = true;
  mainCoinModalDetails:CoinModalFieldData | null = null;

  // Whenever the modal is closed or opened, set:
  // 1. mainCoinModalDetails to null
  // 2. set the submitAddCoinButtonStatusIsDisabled to true
  // Important as to ensure the data within this modal is reset to this default setting
  @Watch('isActive')
  coinModalDetailsToNullMethod(){
    this.mainCoinModalDetails = null;
    this.submitAddCoinButtonStatusIsDisabled = true;
  }

  // Whenever loading page is triggered, ensure that add coin button is disabled
  // When loading status is finished, set the add coin button to be active
  @Watch('loadingStatus')
  disableEnableSubmitButton(){
    if(this.loadingStatus){
      this.submitAddCoinButtonStatusIsDisabled = true;
    }else{
      this.submitAddCoinButtonStatusIsDisabled = false;
    }
  }

  // Set the availableCoinOptionsList to contain the coins that are not bought yet (will set the options in the modal)
  @Watch('listOfExistingCoins')
  updateAvailableCoinOptionsList(){
    // Ensure that the availableCoinOptionsList is always an empty array on each call of the function
    // to avoid any accidental duplicate elements in list and to refresh the list
    this.availableCoinOptionsList = [];
    for(const option of this.coinOptionsList){
      if(!this.listOfExistingCoins.includes(option.coinName!)){
        this.availableCoinOptionsList.push(option);
        this.selectedCoinOptionName = this.availableCoinOptionsList[0].coinName!;
        this.coinOptionDropdownDisabled = false;
      }
      // If all coin options have been bought, then set the option dropdown to be disabled and empty
      // This should in turn disable the add new coin ability since no new coin can be added
      if(
        this.listOfExistingCoins.includes(option.coinName!) && 
        this.availableCoinOptionsList.length === 0
      ){
        this.selectedCoinOptionName = '';
        this.coinOptionDropdownDisabled = true;
      }
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
  // If the coinOptionDropdown is disabled (meaning no options available, then disable the submitAddCoinButtonStatusIsDisabled)
  updateMainCoinModal(partialCoinModalDetails:CoinModalFieldData, isDisabled:boolean){
    this.mainCoinModalDetails = {...partialCoinModalDetails}
    this.submitAddCoinButtonStatusIsDisabled = isDisabled;
    if(this.coinOptionDropdownDisabled){
      this.submitAddCoinButtonStatusIsDisabled = true;
    }
  }

  // Set the selectedCoinOption from the coinOptionsList based on the selectedCoinOptionName
  getSelectedCoin(selectedCoinOptionName: string){
    for(let i = 0; i < this.coinOptionsList.length; i++){
      if(selectedCoinOptionName === this.coinOptionsList[i].coinName){
        this.selectedCoinOption = this.coinOptionsList[i];
      }
    }
  }

  // Send the modal details to the CoinTableComponent together with the selectedCoinOption
  addNewCoinMethod(){
    // First get the selected coin to be added from the coinOptionsList
    this.getSelectedCoin(this.selectedCoinOptionName);
    this.$emit(`triggerAddNewCoinEvent`, this.mainCoinModalDetails, this.selectedCoinOption);
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
  &__no-dropdown-available{
    @include modalNoDropdownFieldDefault();
  }
  &__buttons{
    @include modalButtonsDefault();
  }
}
</style>