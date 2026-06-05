const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    proxy: {
      '/api': {
        target: 'http://124.223.101.64:8081',
        changeOrigin: true
      }
    }
  }
})
