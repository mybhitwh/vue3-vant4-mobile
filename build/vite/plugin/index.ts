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
import { configSvgIconsPlugin } from './svgSprite'

/**
 * 创建 vite 插件配置信息
 * @param viteEnv vite 环境变量配置文件键值队 object
 * @param isBuild 是否是 build 环境 true/false
 * @returns vitePlugins[]
 */
export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean, prodMock: boolean) {
  // VITE_BUILD_COMPRESS 是否启用 gzip 压缩或 brotli 压缩
  // 可选: gzip | brotli | none，
  // 如果你需要多种形式，你可以用','来分隔

  // VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE 打包使用压缩时是否删除原始文件，默认为 false
  const { VITE_USE_MOCK, VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv

  const vitePlugins: (PluginOption | PluginOption[])[] = [
    // @vitejs/plugin-vue插件，必备，官方插件
    vue(),
    // 按需引入VantUi解析器，用于自动创建组件声明
    Components({
      dts: true,
      resolvers: [VantResolver()],
      types: [],
    }),
    // 使用UnoCSS插件
    UnoCSS(),
    // 使用自动导入API插件
    AutoImport({
      // 定义要使用按需自动导入API的文件
      // $——匹配字符串的结束
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
  ]

  // 加载 html 插件 vite-plugin-html
  vitePlugins.push(configHtmlPlugin(viteEnv, isBuild))

  // rollup-plugin-visualizer
  vitePlugins.push(configVisualizerConfig())

  // vite-plugin-mock
  VITE_USE_MOCK && vitePlugins.push(configMockPlugin(isBuild, prodMock))

  // vite-plugin-svg-icons
  vitePlugins.push(configSvgIconsPlugin(isBuild))

  if (isBuild) {
    // rollup-plugin-gzip
    // 加载 gzip 打包
    vitePlugins.push(
      configCompressPlugin(VITE_BUILD_COMPRESS, VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE),
    )
  }

  return vitePlugins
}
