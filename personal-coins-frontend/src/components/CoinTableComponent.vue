<template>
  <div class="table-container">
    <b-table
      :data="coinList.list"
      :selected.sync="selectedRow"
      focusable
      class="table"
    >
      <b-table-column field="id" label="ID" v-slot="props">
        {{ props.row.id }}</b-table-column
      >
      <b-table-column field="coinName" label="Coin" v-slot="props">
        {{ props.row.coinName }}</b-table-column
      >
      <b-table-column
        field="currentAmountOwned"
        label="Curent Amount Owned"
        v-slot="props"
      >
        {{ props.row.currentAmountOwned }}
      </b-table-column>
      <b-table-column
        field="currentCoinMarketPrice"
        label="Current Coin Market Price"
        v-slot="props"
      >
        {{ props.row.currentCoinMarketPrice }}
      </b-table-column>
      <b-table-column
        field="dollarCostAverage"
        label="Dollar Cost Avg"
        v-slot="props"
      >
        {{ props.row.dollarCostAverage }}
      </b-table-column>
      <b-table-column
        field="dollarSoldAverage"
        label="Dollar Sold Avg"
        v-slot="props"
      >
        {{ props.row.dollarSoldAverage }}
      </b-table-column>
      <b-table-column field="totalBought" label="Total Bought" v-slot="props">
        {{ props.row.totalBought }}
      </b-table-column>
      <b-table-column field="totalSold" label="Total Sold" v-slot="props">
        {{ props.row.totalSold }}
      </b-table-column>
      <b-table-column
        field="unrealisedProfitLossPercentage"
        label="Unrealised Profit Loss Percentage"
        v-slot="props"
      >
        {{ props.row.unrealisedProfitLossPercentage }}
      </b-table-column>
      <b-table-column
        field="realisedProfitLossPercentage"
        label="Realised Profit Loss Percentage"
        v-slot="props"
      >
        {{ props.row.realisedProfitLossPercentage }}
      </b-table-column>
      <b-table-column
        field="lastBoughtAmount"
        label="Last Bought Amount"
        v-slot="props"
      >
        {{ props.row.lastBoughtAmount }}
      </b-table-column>
      <b-table-column
        field="lastBoughtDate"
        label="Last Bought Date"
        v-slot="props"
      >
        {{ props.row.lastBoughtDate }}
      </b-table-column>
      <b-table-column
        field="lastSoldAmount"
        label="Last Sold Amount"
        v-slot="props"
      >
        {{ props.row.lastSoldAmount }}
      </b-table-column>
      <b-table-column
        field="lastSoldDate"
        label="Last Sold Date"
        v-slot="props"
      >
        {{ props.row.lastSoldDate }}
      </b-table-column>
    </b-table>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { coinStore } from "../store/coin-store/coin.store.index";
import { Coin } from "../models/table.model";

@Component({
  components: {},
})
export default class CoinTableComponent extends Vue {
  coinList = coinStore.listCoin;
  results: Array<Coin> = [];
  selectedRow = null;

  async mounted() {
    await this.coinList.getCoinList();
    this.results = this.coinList.list;
    console.log(this.coinList.list);
    this.selectedRow = null;
  }

  // data() {
  //   const data = [
  //     {
  //       id: 1,
  //       first_name: "Jesse",
  //       last_name: "Simmons",
  //       date: "2016-10-15 13:43:27",
  //       gender: "Male",
  //     },
  //     {
  //       id: 2,
  //       first_name: "John",
  //       last_name: "Jacobs",
  //       date: "2016-12-15 06:00:53",
  //       gender: "Male",
  //     },
  //     {
  //       id: 3,
  //       first_name: "Tina",
  //       last_name: "Gilbert",
  //       date: "2016-04-26 06:26:28",
  //       gender: "Female",
  //     },
  //     {
  //       id: 4,
  //       first_name: "Clarence",
  //       last_name: "Flores",
  //       date: "2016-04-10 10:28:46",
  //       gender: "Male",
  //     },
  //     {
  //       id: 5,
  //       first_name: "Anne",
  //       last_name: "Lee",
  //       date: "2016-12-06 14:38:38",
  //       gender: "Female",
  //     },
  //   ];

  //   return {
  //     data,
  //     selected: data[1],
  //     columns: [
  //       {
  //         field: "id",
  //         label: "ID",
  //         width: "40",
  //         numeric: true,
  //       },
  //       {
  //         field: "first_name",
  //         label: "First Name",
  //       },
  //       {
  //         field: "last_name",
  //         label: "Last Name",
  //       },
  //       {
  //         field: "date",
  //         label: "Date",
  //         centered: true,
  //       },
  //       {
  //         field: "gender",
  //         label: "Gender",
  //       },
  //     ],
  //   };
  // }
}
</script>

<style lang="scss">
.table-container {
  display: flex;
  justify-content: center;
  margin: 40px;
  & .table {
    width: 80%;
    & .th-wrap {
      justify-content: center;
    }
  }
}
</style>
