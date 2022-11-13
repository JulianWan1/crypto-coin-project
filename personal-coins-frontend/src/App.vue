<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">

export default {
  mounted(){
    document.title = 'Crypto Coin App';
  }
}
</script>


<style lang="scss" scoped>
#app {
  @include pageDefaultStyle();
}
</style>
