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
        Confirm delete {{coinName}} from your portfolio?
        <br>
        Action is IRREVERSIBLE and all event history will be LOST 
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
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component({})
export default class DeleteCoinModal extends Vue {

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({default:false})
  loadingStatus!:boolean;

  @Prop()
  coinName!:string;

  deleteCoinMethod(){
    this.$emit(`triggerDeleteCoinEvent`)
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