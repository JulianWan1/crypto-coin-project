<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
  >
    <div class="add-new-coin-modal-container">
      <div class="modal-title">
        Add New Coin
      </div>
      <div class="add-new-coin-dropdown">
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
      <CoinDetailsModalComponent
        @retrievePartialCoinModalDetails="updateMainCoinModal"
      />
      <div class="modal-buttons">
        <button 
          class="cancel-button"
          :disabled="loadingStatus"
          @click="closeModalFunction"  
        >
          Cancel
        </button>
        <button 
          class="add-new-coin-button"
          :disabled="submitAddCoinButtonStatusIsDisabled"
          @click="addNewCoinMethod"
        >
          Add
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import {Vue, Prop, Component} from 'vue-property-decorator'
import { BuySellCreateCoinRequestBody } from '../../models/api-related-model';
import { CoinModalFieldData } from '../../models/form-data.model';

@Component({
  components:{}
})

export default class AddNewCoinModal extends Vue {

  @Prop({ default: false })
  isActive!: boolean;

  // Get the list of existing coins from the CoinTableComponent
  // to ensure that the dropdown will only show coins that are not bought
  @Prop()
  listOfExistingCoins: string[];

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
  availableCoinOptionsList = [];
  selectedCoinOptionName = '';
  selectedCoinOption:Partial<BuySellCreateCoinRequestBody> | null = null;
  coinOptionDropdownDisabled = false;
  submitAddCoinButtonStatusIsDisabled = true;
  mainCoinModalDetails:CoinModalFieldData | null = null;


  // Set the availableCoinOptionsList to contain the coins that are not bought yet (will set the options in the modal)
  mounted(){
    for(const option of this.coinOptionsList){
      if(!this.listOfExistingCoins.includes(option.coinName)){
        this.availableCoinOptionsList.push(option);
        this.selectedCoinOptionName = this.availableCoinOptionsList[0].coinName;
      }
      // If all coin options have been bought, then set the option dropdown to be disabled
      // This should in turn disable the add new coin ability since no new coin can be added
      if(
        this.listOfExistingCoins.includes(option.coinName) && 
        this.coinOptionsList.indexOf(option) === this.coinOptionsList.length - 1
      ){
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
      this.submitAddCoinButtonStatusIsDisabled = false
    }
    console.log(`mainCoinModalDetails from AddNewCoinModal: ${JSON.stringify(this.mainCoinModalDetails)}`)
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
    console.log(`mainCoinModalDetails after add new coin attempt: ${JSON.stringify(this.mainCoinModalDetails)}`);
  }

}

</script>

<style lang="scss">
.add-new-coin-modal-container{
    display:flex;
    flex-direction: column;
    background-color: white;
  } 
</style>