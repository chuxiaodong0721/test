const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    host: 'localhost',
    port: 8089,
    open: true,
    proxy: {
      ['/car']: {
        target: `http://192.168.1.100:8080`, //所有配置不要动，只改这一个地方，改完重启项目
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          ['^/' + 'car']: '',
        },
      },
    },
  },
})
