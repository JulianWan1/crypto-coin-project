import { ToastProgrammatic as Toast } from 'buefy'
import { BNoticeComponent } from 'buefy/types/components'

export function successToastMethod(successToast:null|BNoticeComponent, message:string){
  return successToast = Toast.open({
    indefinite: true,
    message: message,
    type:'is-success',
  })
}

export function failedToastMethod(message:string){
  Toast.open({
    message:message,
    duration: 6000,
    type:"is-danger"
  })
}