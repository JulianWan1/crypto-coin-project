<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
    width="800px"
    class="modal"
  >
  <div
    class="modal__container"
  >
    <div class="modal__title">
      Confirm delete {{eventType}} event #{{eventId}} on {{eventDateFromSelectedEvent}} from {{coinName[0].toUpperCase()+coinName.slice(1)}}?
      <br>
      Action is IRREVERSIBLE and event will be LOST
    </div>
    <div class="modal__buttons">
      <b-button 
        class="delete-button"
        :disabled="loadingStatus"
        @click="deleteCoinMethod"
      >
        Delete
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
import { CoinEventLog } from '../../models/table.model';
@Component({})

export default class DeleteCoinEventModal extends Vue {

  @Prop()
  isActive!: boolean;

  @Prop({default:false})
  loadingStatus!:boolean;

  @Prop()
  coinName!:string;

  @Prop()
  coinEventDetails!: CoinEventLog;

  eventId: number | null = null;
  eventType = ''
  eventDateFromSelectedEvent: string | null = null;

  @Watch('coinEventDetails')
  retrieveSelectedCoinEvent(){
    if(this.coinEventDetails){
      const { 
        id,
        eventType, 
        eventDate
      } = this.coinEventDetails
      this.eventId = id;
      this.eventType = eventType === 2 ? 'BUY' : 'SELL'
      this.eventDateFromSelectedEvent = new Date(eventDate).toLocaleString();
    }
  }

  deleteCoinMethod(){
    this.$emit(`triggerDelete`)
  }

  closeModalFunction(){
    this.$emit(`closeModal`)
  }

}
</script>

<style lang="scss">
.modal{
  @include modalFontDefault(general);
  @include modalGeneralDefault();
  &__container{
    @include modalContainerDefault();
  }
  &__title{
    @include modalFontDefault(sub-title);
  }
  &__buttons{
    @include modalButtonsDefault();
  }
}
</style>