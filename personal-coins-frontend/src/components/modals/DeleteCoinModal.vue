<template>
  <b-modal
    :active="isActive"
    :can-cancel="[`${loadingStatus?'':'escape'}`, `${loadingStatus?'':'outside'}`]"
    :on-cancel="closeModalFunction"
  >
    <div
      class="delete-coin-modal-container"
    >
      <div class="delete-coin-warning-message">
        Confirm delete {{coinName}} from your portfolio?
        <br>
        Action is IRREVERSIBLE and all event history will be LOST 
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
.delete-coin-modal-container{
    display:flex;
    flex-direction: column;
    background-color: white;
  } 
</style>