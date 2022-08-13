<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
  >
  <div
    class="delete-coin-event-modal-container"
  >
    <div class="delete-coin-event-warning-message">
      Confirm delete {{eventType}} event #{{eventId}} on {{eventDateFromSelectedEvent}} from {{coinName[0].toUpperCase()+coinName.slice(1)}}?
      <br>
      Action is IRREVERSIBLE and event will be LOST
    </div>
    <div class="modal-buttons">
      <button 
        class="cancel-button"
        :disabled="loadingStatus"
        @click="closeModalFunction"  
      >
        Cancel
      </button>
      <button 
        class="delete-coin-button"
        :disabled="loadingStatus"
        @click="deleteCoinMethod"
      >
        Delete
      </button>
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
.delete-coin-event-modal-container{
    display:flex;
    flex-direction: column;
    background-color: white;
  } 
</style>