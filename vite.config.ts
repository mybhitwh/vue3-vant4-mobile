import { resolve } from 'node:path'

// import type，TypeScript语法，只引入类型定义以进行类型检查，不引入具体实现，可以减少打包大小和提高构建速度
// ConfigEnv配置环境类型，用于获取环境变量配置，以实现条件配置
// UserConfig类型，用于定义Vite配置对象的类型
import type { ConfigEnv, UserConfig } from 'vite'

// 加载环境变量，供在配置文件中使用
import { loadEnv } from 'vite'

// format 函数用于将日期格式化为指定格式的字符串。本例中用于格式化App信息中的最后编译时间
import { format } from 'date-fns'

// 读取环境变量配置文件，将环境变量键值对转为对象
import { wrapperEnv } from './build/utils'
import { createVitePlugins } from './build/vite/plugin'

// 导入构建输出路径
import { OUTPUT_DIR } from './build/constant'

import { createProxy } from './build/vite/proxy'
import pkg from './package.json'

// 导入package.json中的配置选项，用于设置__APP_INFO__
const { dependencies, devDependencies, name, version } = pkg

/**
 * 将相对路径转为绝对路径。
 *
 *
 * 为什么要转换？当使用文件系统路径的别名时，相对路径的别名值会原封不动地被使用，无法被正常解析。所以，需要始终使用绝对路径。
 * path.resolve([from ...], to) 方法，用于将一系列路径段解析为绝对路径。
 * process.cwd() 方法返回 Node.js 进程的当前工作目录的绝对路径
 * @param dir 相对路径
 * @returns 绝对路径
 */
function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// APP信息字面量
const __APP_INFO__ = {
  // APP 后台管理信息
  pkg: { dependencies, devDependencies, name, version },
  // 最后编译时间
  lastBuildTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
}

/**
 * 由于 Vite 附带了 TypeScript 类型，因此你可以通过设置 jsdoc 类型提示来使用 IDE 的代码不全功能。
 * 传入参数({ command, mode }: ConfigEnv)的目的是为了实现条件配置。
 * command 返回命令类型，有两个值：
 *  serve——开发命令，即CLI执行`vite`、`vite dev`或`vite serve`命令；
 *  build——构建命令，即CLI执行`vite build`命令
 * mode 返回应用的环境的模式。本示例中，是 development 或者 production
 */
/** @type {import('vite').UserConfig} */
export default ({ command, mode }: ConfigEnv): UserConfig => {
  // -----------------读取.env配置文件中的环境变量-----------------
  // process.cwd() 方法返回 Node.js 进程的当前工作目录
  const root = process.cwd()
  // loadEnv() 根据 mode 选择 root 路径下的 .env 类文件，输出以 VITE_ 开头的键值对
  const env = loadEnv(mode, root)
  // 读取并处理所有环境变量配置文件 .env，将键值对转为ViteEnv对象，并写入process.env
  const viteEnv = wrapperEnv(env)
  /**
   * 解构出环境变量配置文件的值
   * VITE_PUBLIC_PATH —— 网站根目录
   * VITE_DROP_CONSOLE —— 是否剔除 console.log
   * VITE_PORT —— 端口号
   * VITE_PROXY —— 代理配置
   * VITE_GLOB_PROD_MOCK —— 是否开启生产环境模拟数据
   */
  const { VITE_PUBLIC_PATH, VITE_DROP_CONSOLE, VITE_PORT, VITE_PROXY, VITE_GLOB_PROD_MOCK } = viteEnv
  const prodMock = VITE_GLOB_PROD_MOCK

  // 判断是否为生产环境
  const isBuild = command === 'build'
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      // 创建文件系统路径别名
      alias: [
        // @/xxxx => src/xxxx
        {
          find: /\@\//,
          replacement: `${pathResolve('src')}/`,
        },
        // #/xxxx => types/xxxx
        {
          find: /\#\//,
          replacement: `${pathResolve('types')}/`,
        },
      ],
      // 删除 vue 的重复依赖
      dedupe: ['vue'],
    },

    // 定义全局常量替换
    define: {
      // 未使用。在生产中 启用/禁用 intlify-devtools 和 vue-devtools 支持，默认值 false
      __INTLIFY_PROD_DEVTOOLS__: true,
      // 未使用。App基本信息
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },

    esbuild: {
      // 使用 esbuild 压缩 剔除 console.log
      drop: VITE_DROP_CONSOLE ? ['debugger', 'console'] : [],
    },

    build: {
      // 设置最终构建的浏览器兼容目标，针对具有原生 ES 模块、原生 ESM 动态导入和 import.meta 支持的浏览器。
      target: 'modules',
      // 启用 esbuild 的代码混淆和压缩功能
      minify: 'esbuild',
      // 构建后是否生成 source map 文件(用于线上报错代码报错映射对应代码)
      sourcemap: false,
      // 指定输出路径（相对于 项目根目录)
      outDir: OUTPUT_DIR,
      // 启用/禁用 gzip 压缩大小报告
      // 压缩大型输出文件可能会很慢，因此禁用该功能可能会提高大型项目的构建性能
      reportCompressedSize: true,
      // chunk 大小警告的限制（以 kbs 为单位）
      chunkSizeWarningLimit: 2000,
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        output: {
          // 定义了共享块的命名规则
          chunkFileNames: 'js/[name]-[hash].js',
          // 定义入口点的块的命名规则
          entryFileNames: 'js/[name]-[hash].js',
          // 定义静态资源文件的命名规则
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          // 通过manualChunks方法，将项目中引用的node_modules中的三方依赖包按包名进行拆分，以达到更细粒度的缓存和并行加载效果。
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const paths = id.toString().split('node_modules/')
              if (paths[2]) {
                return paths[2].split('/')[0].toString()
              }
              return paths[1].split('/')[0].toString()
            }
          },
        },
      },
    },

    css: {
      preprocessorOptions: {
        // 选择less作为CSS预处理器
        less: {
          // 允许运行时修改less变量，目前为空，即不允许修改任何变量
          modifyVars: {},
          // 允许在.less文件中计算内联JavaScript，默认为false，因为这给一些开发人员带来了安全问题。
          javascriptEnabled: true,
          // 注入全局 less 变量
          additionalData: `@import "src/styles/var.less";`,
        },
      },
    },

    server: {
      host: true,
      // 服务启动时是否自动打开浏览器
      open: true,
      // 服务端口号
      port: Number(VITE_PORT),
      // 服务代理
      proxy: createProxy(VITE_PROXY),
      // 预热文件以降低启动期间的初始页面加载时长
      warmup: {
        // 预热的客户端文件：首页、views、 components
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
      // proxy: {
      //     '/api': {
      //         target: '',
      //         changeOrigin: true,
      //         rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      //     }
      // }
    },

    optimizeDeps: {
      /**
       * 依赖预构建，vite 启动时会将下面 include 里的模块，编译成 esm 格式并缓存到 node_modules/.vite 文件夹，
       * 页面加载到对应模块时如果浏览器有缓存就读取浏览器缓存，如果没有会读取本地缓存并按需加载
       * 尤其当您禁用浏览器缓存时（这种情况只应该发生在调试阶段）必须将对应模块加入到 include 里，
       * 否则会遇到开发环境切换页面卡顿的问题（vite 会认为它是一个新的依赖包会重新加载并强制刷新页面），
       * 因为它既无法使用浏览器缓存，又没有在本地 node_modules/.vite 里缓存
       * 温馨提示：如果你使用的第三方库是全局引入，也就是引入到 src/main.ts 文件里，
       * 就不需要再添加到 include 里了，因为 vite 会自动将它们缓存到 node_modules/.vite
       */
      include: [
        'pinia',
        'lodash-es',
        'axios',
      ],
      // 打包时强制排除的依赖项
      exclude: [
        // https://www.mulingyuer.com/archives/928/
        'vant',
        '@vant/use',
      ],
    },

    // 加载插件
    plugins: createVitePlugins(viteEnv, isBuild, prodMock),
  }
}
