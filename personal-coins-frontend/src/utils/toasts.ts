import { ToastProgrammatic as Toast } from 'buefy'
import { BNoticeComponent } from 'buefy/types/components'

export function updateSuccessToast(successToast:null|BNoticeComponent, message:string){
  return successToast = Toast.open({
    indefinite: true,
    message: message,
    type:'is-success',
    position:"is-top-right"
  })
}

export function updateFailedToast(message:string){
  Toast.open({
    message:message,
    duration: 6000,
    type:"is-danger"
  })
}

// export function closeToast(toastInstance:BNoticeComponent|null){
//   if(toastInstance){
//     toastInstance.close();
//     return toastInstance = null;
//   }
// }