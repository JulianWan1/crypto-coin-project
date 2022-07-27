import { DialogProgrammatic as dialog } from "buefy";
import { updateSuccessToast } from '../utils/toasts'

export function confirmUpdateEventDialog(
  message: string
){
    let proceedUpdateEvent:null|boolean = null;
    dialog.confirm({
      title:'Confirm Updates?',
      message: message,
      confirmText:'Confirm',
      cancelText:'Back To Modal',
      onConfirm: ()=>{return proceedUpdateEvent = true},
      onCancel: ()=>{return proceedUpdateEvent = false}
    })
  return proceedUpdateEvent;
}