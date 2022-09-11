<template>
  <div class="modal-fields">
    <b-field 
      class="modal-fields__numeric-field"
      label="Quantity"
      message="accepts up to 6 integers and 6 decimal places"
    >
      <b-input 
        type="text" 
        v-model="partialCoinModalDetails.quantity"
        @input="detectValueFromField($event)"
      />
    </b-field>
    <b-field 
      class="modal-fields__numeric-field"
      label="Market Price"
      message="accepts up to 8 integers and 2 decimal places"
    >
      <b-input 
        type="text" 
        v-model="partialCoinModalDetails.marketPrice"
        @input="detectValueFromField($event)"
      />
    </b-field>
    <b-field 
      class="modal-fields__numeric-field"
      label="Network Fee"
      message="accepts up to 8 integers and 2 decimal places"
    >
      <b-input 
        type="text" 
        v-model="partialCoinModalDetails.networkFee"
        @input="detectValueFromField($event)"
      />
    </b-field>
    <b-field 
      class="modal-fields__numeric-field"
      label="Exchange Premium"
      message="accepts up to 8 integers and 2 decimal places"
    >
      <b-input 
        type="text" 
        v-model="partialCoinModalDetails.exchangePremium"
        @input="detectValueFromField($event)"
      />
    </b-field>
    <b-field 
      class="modal-fields__date-time"
      label="Date and Time"
    >
      <b-datetimepicker 
        ref="datetimepicker"
        v-model="partialCoinModalDetails.dateTime"
        @input="detectValueFromField($event)"
        placeholder="Click to select..."
        position="is-top-left"
        horizontal-time-picker
      >
        <template #left>
          <b-button
            label="Now"
            type="is-primary"
            icon-left="clock"
            @click="dateButtonFunctionality('now')" 
          />
        </template>
        <template #right>
          <b-button
            v-if="isAnUpdateEventModalType"
            label="Revert"
            type="is-danger"
            icon-left="clock-rotate-left"
            outlined
            @click="dateButtonFunctionality('revert')" 
          />
        </template>
      </b-datetimepicker>
      <b-button
        @click="$refs.datetimepicker.toggle()"
        icon-left="calendar"
        type="is-primary" 
      />
    </b-field>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { CoinModalFieldData } from '../../../models/form-data.model'
import { 
  validateInputNumberPrecisionTwelveScaleSix, 
  validateInputNumberPrecisionNineScaleTwo 
  } from '../../../utils/validation'
import { 
  precisionTwelveScaleSixFieldsArray, 
  precisionNineScaleTwoFieldsArray 
  } from '../../../utils/array-fields-validation'

@Component({
  components:{}
})

export default class CoinDetailsModalComponent extends Vue{

  @Prop()
  coinEventDetails!: CoinModalFieldData

  @Prop({default: null})
  eventDateFromSelectedEvent!: Date | null

  @Prop({ default: false })
  updateEventModalType!: boolean

  partialCoinModalDetails: CoinModalFieldData = {
    quantity: null,
    marketPrice: null,
    exchangePremium: null,
    networkFee: null,
    dateTime: null
  }

  isAnUpdateEventModalType = false;

  initialDateOfEvent: Date | null = null;

  isDisabled = true;

  mounted(){
    // FOLLOWING MEANT FOR UPDATE EVENTS MODAL ONLY
    // Set the partialCoinModalDetails to have the data from the parent component (coinEventDetails)
    // when mounted
    // If the modal using this component is the event update modal, set isAnUpdateEventModalType to the prop (which should be true)
    // (So far it is used to set the revert button on or off)
    if(this.updateEventModalType){
      this.partialCoinModalDetails = {
        ...this.coinEventDetails, 
        dateTime: new Date(this.coinEventDetails.dateTime as Date)
      }
      this.isAnUpdateEventModalType = this.updateEventModalType
    }
    console.log(`From CoinDetailsModalComponent mounted: ${JSON.stringify(this.partialCoinModalDetails)}`)

    // Set the initialDateOfEvent to the selected event row's event date
    // This is also to ensure if any re-mounts (rediting of updates in modal by user)
    // was done, the initialDateOfEvent will always refer to the selected event's event date only
    if(this.eventDateFromSelectedEvent){
      this.initialDateOfEvent = this.eventDateFromSelectedEvent as Date;
      console.log(`initialDateOfEvent: ${this.initialDateOfEvent}`);
    }
  }

// Function that emits the changes of any of the fields of the modal 
// back to the parent component through emission (this.$emit)
// Arguments include the new value and the partialCoinModalDetails object's key name
  detectValueFromField(){
    // Check if the numeric field values are number type & conform to their respective precision & scale (conform to the regex sets in validation.ts)
    // No zero values also (edge case not put into consideration where network fee or exchange premium could be 0 (super remote possibility)
    let hasError = false;
    for(let key in this.partialCoinModalDetails){
      const newKey = key as keyof CoinModalFieldData;
      if(
        newKey !== 'dateTime' &&
        this.partialCoinModalDetails[newKey]
        ){
          if(
            precisionTwelveScaleSixFieldsArray.includes(newKey.toString()) &&
            (
              Number(this.partialCoinModalDetails[newKey]) === 0 ||
              !validateInputNumberPrecisionTwelveScaleSix(this.partialCoinModalDetails[newKey] as string)
            )
            ){
              hasError = true;
          }else if(
            precisionNineScaleTwoFieldsArray.includes(newKey.toString()) &&
            (
              Number(this.partialCoinModalDetails[newKey]) === 0 ||
              !validateInputNumberPrecisionNineScaleTwo(this.partialCoinModalDetails[newKey] as string)
            )
            ){
              hasError = true;
          }
        }else if(
          newKey !== 'dateTime' &&
          (
            !this.partialCoinModalDetails[newKey] ||
            Number(this.partialCoinModalDetails[newKey]) === 0
          )
        ){
          hasError = true;
        }else if(
          newKey === 'dateTime' &&
          !this.partialCoinModalDetails[newKey]
        ){
          hasError = true;
        }
    }
    this.isDisabled = hasError;
    console.log(`From CoinDetailsModalComponent detectValueFromField:${JSON.stringify(this.partialCoinModalDetails)}`)
    this.$emit('retrievePartialCoinModalDetails', this.partialCoinModalDetails, this.isDisabled)
  }

// Function for the date if click on Revert, the date reverts back to previous state
// If click on Now, set the date to current date
  dateButtonFunctionality(buttonMode:string){
    if( buttonMode === 'revert' ){
      this.partialCoinModalDetails.dateTime = this.initialDateOfEvent;
    }else if( buttonMode === 'now' ){
      this.partialCoinModalDetails.dateTime = new Date();
    }
    this.detectValueFromField()
  }

}

</script>

<style lang="scss" scoped>
  .modal-fields{
    @include modalDetailsDefault();
    &__numeric-field{
      @include modalNumericFieldDefault();
    }
    &__date-time{
      @include modalDateTimePickerDefault();
    }
  }

</style>
