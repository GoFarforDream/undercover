const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  // 配置代理，解决 Dify 接口跨域
  devServer: {
    proxy: {
      '/api': {
        target: 'http://uc.voyagers.work/v1', // 你的 Dify 地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
})