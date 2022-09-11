<template>
  <div class="home">
    <h1 class="home__title">Crypto Portfolio</h1>
    <CoinTableComponent/>
    <h3 class="home__author">Julian, 2022</h3>
    <h3 class="home__credits">powered by: LiveCoinWatch</h3>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CoinTableComponent from "../components/CoinTableComponent.vue";

@Component({
  components: {
    CoinTableComponent,
  },
})
export default class PortfolioView extends Vue {}
</script>

<style lang="scss" scoped>
.home{
  @include viewDefaultStyle();
}
</style>
