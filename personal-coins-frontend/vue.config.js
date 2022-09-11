const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        // @/ is an alias to src/
        additionalData: `
        @import "@/scss/styles";
        `,
      },
    },
  },
});
