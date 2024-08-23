/**
 * Plugin to minimize and use ejs template syntax in index.html.
 * https://github.com/anncwb/vite-plugin-html
 */
import type { PluginOption } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import pkg from '../../../package.json'
import { GLOB_CONFIG_FILE_NAME } from '../../constant'

/**
 * 配置HtmlPlugin，用于在构建过程中处理index.html文件
 * @param env 构建环境变量，包括全局应用标题和公共路径等
 * @param isBuild 表示是否为构建过程，用于区分开发和构建时的行为
 * @returns 返回HtmlPlugin的配置，用于注入数据和脚本标签
 */
export function configHtmlPlugin(env: ViteEnv, isBuild: boolean) {
  // 从环境变量中提取应用标题和公共路径
  const { VITE_GLOB_APP_TITLE, VITE_PUBLIC_PATH } = env

  // 确保公共路径以斜杠结尾
  const path = VITE_PUBLIC_PATH.endsWith('/') ? VITE_PUBLIC_PATH : `${VITE_PUBLIC_PATH}/`

  // 获取应用配置文件的路径方法
  const getAppConfigSrc = () => {
    // 返回配置文件路径，包含版本和时间戳以实现缓存 bust
    return `${path || '/'}${GLOB_CONFIG_FILE_NAME}?v=${pkg.version}-${new Date().getTime()}`
  }

  // 当执行 yarn build 构建项目之后，会自动生成 _app.config.js 文件并插入 index.html
  // _app.config.js 用于项目在打包后，需要动态修改配置的需求，如接口地址
  // 不用重新进行打包，可在打包后修改 /dist/_app.config.js 内的变量，刷新即可更新代码内的局部变量

  // 初始化HtmlPlugin配置
  const htmlPlugin: PluginOption[] = createHtmlPlugin({
    // 根据是否构建，决定是否压缩html
    minify: isBuild,
    // 定义注入index.html中的ejs模板的数据
    inject: {
      // data的数据可以在 index.html 中使用 ejs 模版语法获取，为<div><%= title %></div>
      data: {
        // 注入应用标题到index.html
        title: VITE_GLOB_APP_TITLE,
      },

      // 嵌入生成的应用配置文件app.config.js file 需要注入的标签列表
      tags: isBuild
        ? [
            {
              tag: 'script',
              attrs: {
                // 动态获取配置文件路径
                src: getAppConfigSrc(),
              },
            },
          ]
        : [],
    },
  })
  // 返回配置好的HtmlPlugin
  return htmlPlugin
}
