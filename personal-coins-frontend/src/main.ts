import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Buefy from "buefy";
import "buefy/dist/buefy.css";
import "./settings-for-main/icons" 

Vue.config.productionTip = false;

Vue.use(
  Buefy, 
  {
    defaultIconComponent: 'vue-fontawesome',
    defaultIconPack: 'fas'
  }
);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
