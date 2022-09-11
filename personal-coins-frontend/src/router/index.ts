import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import PortfolioView from "../views/PortfolioView.vue";
import CoinEventLogView from "../views/CoinEventLogView.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "PortfolioView",
    component: PortfolioView,
  },
  {
    path: "/logs/:coinName",
    name: "CoinEvents",
    component: CoinEventLogView,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
