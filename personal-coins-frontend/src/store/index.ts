import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {},
});

// Install vuex-module-decorators
// Set the module for each store file
// (originally modules are used to create stores of separate concerns in one single index file)
// (using vuex-module-decorators help to separate these files outside of index.ts, making it more manageable)
// set dynamic module (to ensure other vue plugins can leverage VueX)
// module name is required if dynamic module is set to true
// set namespaced for the module to ensure defined mutators, actions, etc. are self contained (read vuex documentation for further explanation)
// set store to define which store the module should be injected to
// Set the store states, mutators, and actions
// Install axios
// State follows the data format required for table population (follow edotco)
// Axios get call API in the actions,commit mutators, update state
// Component take the states from store to populate table
// ensure that env file and a dedicated axios file is set up to ensure the axios calls the api using the correct base url for api call
