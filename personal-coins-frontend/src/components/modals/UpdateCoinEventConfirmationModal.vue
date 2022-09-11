<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeConfirmationModal"
    width="800px"
    class="modal"
  >
    <div class="modal__container">
      <div class="modal__title">
        Confirm Update(s) for Event ID #{{eventId}}?
      </div>
      <div class="modal__sub-title">
      {{updateMessage}}
      </div>
      <div class="modal__buttons">
        <b-button 
          class="submit-button"
          :disabled="loadingStatus"
          @click="triggerUpdateConfirmation"
        >
          Confirm
        </b-button>
        <b-button 
          class="cancel-button"
          :disabled="loadingStatus"
          @click="closeConfirmationModal"
        >
          Back to Modal
        </b-button>
      </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import { Emit, Prop, Vue, Component } from 'vue-property-decorator'

@Component({

})

export default class UpdateCoinEventConfirmationModal extends Vue {
  
  @Prop({ default:false })
  isActive!: boolean;

  @Prop()
  updateMessage!: string;

  @Prop()
  eventId!: number;

  @Prop({default:false})
  loadingStatus!:boolean;

  triggerUpdateConfirmation(){
    this.$emit('triggerUpdateConfirmation');
  }

  @Emit('closeConfirmationModal')
    closeConfirmationModal(){
      return;
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