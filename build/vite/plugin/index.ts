import type { PluginOption } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { configHtmlPlugin } from './html'
import { configMockPlugin } from './mock'
import { configCompressPlugin } from './compress'
import { configVisualizerConfig } from './visualizer'

/**
 * 创建 vite 插件配置信息
 * @param viteEnv vite 环境变量配置文件键值队 object
 * @param isBuild 是否是 build 环境 true/false
 * @returns vitePlugins[]
 */
export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  // VITE_BUILD_COMPRESS 是否启用 gzip 压缩或 brotli 压缩
  // 可选: gzip | brotli | none，
  // 如果你需要多种形式，你可以用','来分隔

  // VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE 打包使用压缩时是否删除原始文件，默认为 false
  const { VITE_USE_MOCK, VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv

  // 创建插件数组，用于导入各种插件及其配置
  const vitePlugins: (PluginOption | PluginOption[])[] = []

  // 插件1: @vitejs/plugin-vue插件，Vue官方插件
  vitePlugins.push(vue())

  // 插件2: 用于自动按需导入和声明组件。这里使用VantUi解析器，即自动按需导入和声明Vant组件
  vitePlugins.push(Components({
    dts: true,
    resolvers: [VantResolver()],
    types: [],
  }))

  // 插件3: 使用UnoCSS必须导入的插件
  vitePlugins.push(UnoCSS())

  // 插件4: 按需自动导入API的文件。这里是针对以.ts, .tsx, .js, .jsx, .vue, .vue?vue为后缀的文件，自动导入vue、vue-router、pinia、@vueuse/core的API
  vitePlugins.push(
    AutoImport({
      // 定义要使用此插件的文件
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/, // .vue
        /\.vue\?vue/, // .vue?vue
      ],
      imports: [
        // 预设
        'vue',
        'vue-router',
        // 自定义
        'pinia',
        '@vueuse/core',
      ],
      // TypeScript类型定义文件
      dts: 'types/auto-imports.d.ts',
    }),
  )

  // 插件5: 使用vite-plugin-html插件，在构建过程中对index.html文件进行修改，使用ESJ模板插入应用版本信息和应用配置文件（app.config.js）
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild))

  // 插件6: rollup-plugin-visualizer，用途可视化并分析您的 Rollup 捆绑包，以查看哪些模块占用了空间
  vitePlugins.push(configVisualizerConfig())

  // 是否启用mock插件？
  if (VITE_USE_MOCK) {
    // 插件7: mock插件，在开发环境使用mock数据
    // console.log(`mock插件：是否构建${isBuild}，是否启用mock ${prodMock}`)
    vitePlugins.push(configMockPlugin())
  }

  if (isBuild) {
    // rollup-plugin-gzip
    // 加载 gzip 打包
    vitePlugins.push(
      configCompressPlugin(VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE),
    )
  }

  return vitePlugins
}
