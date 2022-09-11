<template>
  <div class="home">
    <h1 class="home__title">{{coinNameRetrieved[0].toUpperCase() + coinNameRetrieved.slice(1)}} Event Logs</h1>
    <CoinEventLogTableComponent
    :coinName="coinNameRetrieved"
    />
    <h3 class="home__author">Julian, 2022</h3>
    <h3 class="home__credits">powered by: LiveCoinWatch</h3>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CoinEventLogTableComponent from "../components/CoinEventLogTableComponent.vue";

@Component({
  components: {
    CoinEventLogTableComponent,
  },
})
export default class CoinEventLogView extends Vue {
  coinNameRetrieved: string = this.$route.params.coinName;
}

</script>

<style lang="scss" scoped>
.home{
  @include viewDefaultStyle();
}
</style>
