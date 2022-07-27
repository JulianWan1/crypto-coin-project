import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, 
  faExclamationCircle,faArrowUp, faAngleRight, faAngleLeft, 
  faAngleDown, faEye, faEyeSlash, faCaretDown, faCaretUp, 
  faUpload, faCalendar, faClock, faClose, faClockRotateLeft
  } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, 
  faExclamationCircle,faArrowUp, faAngleRight, faAngleLeft, 
  faAngleDown, faEye, faEyeSlash, faCaretDown, faCaretUp, 
  faUpload, faCalendar, faClock, faClose, faClockRotateLeft
);

Vue.component('vue-fontawesome', FontAwesomeIcon)