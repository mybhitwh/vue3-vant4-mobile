/**
 * Mock plugin for development and production.
 * https://github.com/anncwb/vite-plugin-mock
 */
import { viteMockServe } from 'vite-plugin-mock'

export function configMockPlugin(isBuild: boolean, prodMock: boolean) {
  return viteMockServe({
    // 设置读取mock文件时的忽略模式。这里忽略以`_`开头的文件。
    // 忽略的原因是以`_`开头的.js文件不是常规的mock文件
    // mock/_createProductionServer.ts是在生产环境中要注入其他代码中的代码
    // mock/_util.ts是供其他mock文件使用的工具类
    ignore: /^\_/,
    // 设置mock文件存储位置。这里是mock文件夹
    mockPath: 'mock',
    // 设置是否开启本地mock功能，默认为true。
    localEnabled: !isBuild,
    // 设置是否开启生产环境的mock功能，默认为false。
    prodEnabled: isBuild && prodMock,
    // 向每个mock文件注入代码。当 Vite 解析注入的代码时，它会根据当前文件的上下文来解析路径。因此，import './mock/setupMock' 会根据 vite.config.js 的位置来解析路径。
    // 注意，这里的相对路径，是相对于src/main.ts而言的。vite-plugin-mock 的 injectCode 选项注入的代码并不是直接注入到某个特定的文件中，而是注入到 Vite 开发服务器的上下文中。具体来说，这段代码会在 Vite 开发服务器启动时执行。在本例中，是main.ts。因此，这里需要使用../mock
    injectCode: `
      import { setupProdMockServer } from '../mock/_createProductionServer';

      setupProdMockServer();
      `,
    // 是否打印控制台日志
    logger: true,
  })
}
