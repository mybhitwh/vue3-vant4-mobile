import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

/**
 * 判断当前环境是否为开发环境
 *
 * 此函数用于检查给定的模式是否为'development'，主要用于确定应用程序是否在开发环境中运行
 * 在开发环境中，通常会启用额外的调试信息或进行性能测试，因此需要一个方法来做出这种判断
 *
 * @param mode 应用程序的当前模式，通常来自环境变量
 * @returns 返回一个布尔值，如果当前模式是'development'，则返回true，否则返回false
 */
export function isDevFn(mode: string): boolean {
  return mode === 'development'
}

/**
 * 判断当前环境是否为生产环境
 *
 * 此函数用于检查应用程序的当前运行模式是否为生产模式它通过比较内部状态或配置文件中的模式值与 'production' 字符串来实现这一点
 * 在许多应用程序中，代码的行为可能需要根据运行环境（例如开发环境、测试环境或生产环境）而有所不同这种检查常用于确定是否启用某些功能或行为，比如错误报告、日志记录级别或性能优化等
 *
 * @param mode 应用程序的当前运行模式，通常从配置文件或环境变量中获取
 * @returns 返回一个布尔值，如果当前模式是生产环境，则返回 true；否则返回 false
 */
export function isProdFn(mode: string): boolean {
  return mode === 'production'
}

/**
 * 判断当前是否处于报告生成模式
 *
 * 此函数通过检查环境变量中是否设置了REPORT为'true'来确定应用程序是否应该运行在报告生成模式下
 * 这种模式通常用于生成详细运行报告的场景，例如性能报告或错误日志
 *
 * @returns {boolean} 如果环境变量REPORT的值为'true'，则返回true，表示处于报告生成模式；否则返回false
 */
export function isReportMode(): boolean {
  return process.env.REPORT === 'true'
}

/**
 * 环境变量包装器函数
 *
 * 对原始环境变量配置进行处理和转换，以适应 Vite 开发环境。
 * 读取环境变量配置文件，并写入 process.env。
 * 能直接使用 Recordable 和 ViteEnv 类型定义的原因是二者在 global.d.ts 中全局声明。
 *
 * @param envConf 一个记录类型的对象，代表原始的环境变量配置
 * @returns 返回一个经过处理的环境变量对象，以适应Vite的需要
 */
export function wrapperEnv(envConf: Recordable): ViteEnv {
  // 初始化一个空对象来存储处理后的环境变量
  const ret: any = {}

  // 遍历原始环境变量配置的键值对
  for (const envName of Object.keys(envConf)) {
    // 将转义序列`\\n`替换为实际的换行符`\n`
    let realName = envConf[envName].replace(/\\n/g, '\n')

    // 如果环境变量的值为true或false，则转换为布尔值，否则保持不变
    realName = realName === 'true' ? true : realName === 'false' ? false : realName

    // 如果是端口，转为数字
    if (envName === 'VITE_PORT') {
      realName = Number(realName)
    }

    // 如果是代理配置，转为JSON对象一个由[地址,端口]组成的二维数组
    if (envName === 'VITE_PROXY') {
      try {
        realName = JSON.parse(realName)
      }
      catch (error) { }
    }

    // 将处理后的键值对存入返回对象和进程环境变量中
    ret[envName] = realName
    process.env[envName] = realName
  }
  return ret
}

/**
 * 根据给定的前缀匹配和环境配置文件，提取环境变量
 *
 * 此函数的目的是从指定的环境配置文件中读取并筛选出以特定前缀开头的环境变量，
 * 以便在应用程序中使用这些配置
 *
 * @param {string} match 变量前缀的匹配字符串，默认为'VITE_GLOB_'
 * @param {Array<string>} confFiles 环境配置文件的文件名列表，默认为['.env', '.env.production']
 * @returns {object} 返回一个对象，包含所有匹配到的环境变量及其值
 */
export function getEnvConfig(match = 'VITE_GLOB_', confFiles = ['.env', '.env.production']) {
  // 初始化环境配置对象
  let envConfig = {}

  // 遍历配置文件列表，读取并合并环境变量
  confFiles.forEach((item) => {
    try {
      // 使用dotenv解析配置文件内容，并与现有配置合并
      const env = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), item)))
      envConfig = { ...envConfig, ...env }
    }
    // 忽略读取或解析错误
    catch (error) { }
  })

  // 过滤环境变量，仅保留匹配指定前缀的变量
  Object.keys(envConfig).forEach((key) => {
    // 编译正则表达式用于前缀匹配
    const reg = new RegExp(`^(${match})`)
    // 删除不匹配的变量
    if (!reg.test(key)) {
      Reflect.deleteProperty(envConfig, key)
    }
  })

  // 返回过滤后的环境配置对象
  return envConfig
}

/**
 * 获取根目录路径
 *
 * 该函数用于将相对路径或多个路径片段解析为当前工作目录下的绝对路径它接受一个或多个路径片段作为参数，
 * 并将这些片段解析为一个绝对路径这对于在不同模块中引用相同资源时确保路径的正确解析非常有用
 *
 * @param dir 一个或多个路径片段，这些片段将被组合并解析为绝对路径
 * @returns 返回解析后的绝对路径字符串
 *
 * @example
 * // 如果当前工作目录为 /home/user/project ，以下用法将返回 /home/user/project/src
 * getRootPath('src')
 *
 * @example
 * // 如果当前工作目录为 /home/user/project ，以下用法将返回 /home/user/project/src/app
 * getRootPath('src', 'app')
 */
export function getRootPath(...dir: string[]) {
  return path.resolve(process.cwd(), ...dir)
}
