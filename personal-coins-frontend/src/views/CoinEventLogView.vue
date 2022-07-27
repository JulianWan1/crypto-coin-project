<template>
  <div class="home">
    <h1>{{coinNameRetrieved.toUpperCase()}} EVENT LOGS</h1>
    <b-button
      tag="router-link"
      :to="{ name: 'PortfolioView' }"
    >
      Back to Portfolio
    </b-button>
    <CoinEventLogTableComponent
    :coinName="coinNameRetrieved"
    />
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
  mounted(){
    console.log(this.coinNameRetrieved);
  }
}

</script>

<style lang="scss"></style>
