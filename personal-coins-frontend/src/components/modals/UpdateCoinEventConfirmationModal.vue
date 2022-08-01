<template>
  <b-modal
    :active="isActive"
    :can-cancel="['escape', 'outside']"
    :on-cancel="closeConfirmationModal"
  >
    <div class="update-coin-event-confirmation-modal-container">
      <div class="update-confirmation-title">
        Confirm Update(s) for Event ID #{{eventId}}?
      </div>
      <div class="update-confirmation-message">
      {{updateMessage}}
      </div>
      <div class="modal-buttons">
        <button 
          class="back-to-modal-button"
          @click="closeConfirmationModal"
        >
          Back to Modal
        </button>
        <button 
          class="confirm-update-button"
          @click="triggerUpdateConfirmation"
        >
          Confirm
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import {Emit, Prop, Vue, Component} from 'vue-property-decorator'

@Component({

})

export default class UpdateCoinEventConfirmationModal extends Vue {
  
  @Prop({ default:false })
  isActive!: boolean;

  @Prop()
  updateMessage!: string;

  @Prop()
  eventId!: number;

  triggerUpdateConfirmation(){
    this.$emit('triggerUpdateConfirmation');
  }


  @Emit('closeConfirmationModal')
    closeConfirmationModal(){
      return;
  }

}
</script>

<style lang="scss">
.update-coin-event-confirmation-modal-container{
  display: flex;
  flex-direction: column;
  background-color: white;
}
</style>