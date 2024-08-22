import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

export function isDevFn(mode: string): boolean {
  return mode === 'development'
}

export function isProdFn(mode: string): boolean {
  return mode === 'production'
}

/**
 * Whether to generate package preview
 */
export function isReportMode(): boolean {
  return process.env.REPORT === 'true'
}

/**
 * 读取环境变量配置文件，并写入process.env
 * 能直接使用Recordable和ViteEnv类型定义的原因是二者在global.d.ts中全局声明
 * @param envConf 环境变量键值对
 * @returns
 */
export function wrapperEnv(envConf: Recordable): ViteEnv {
  const ret: any = {}

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
      catch (error) {}
    }
    ret[envName] = realName
    process.env[envName] = realName
  }
  return ret
}

/**
 * Get the environment variables starting with the specified prefix
 * @param match prefix
 * @param confFiles ext
 */
export function getEnvConfig(match = 'VITE_GLOB_', confFiles = ['.env', '.env.production']) {
  let envConfig = {}
  confFiles.forEach((item) => {
    try {
      const env = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), item)))
      envConfig = { ...envConfig, ...env }
    }
    catch (error) {}
  })

  Object.keys(envConfig).forEach((key) => {
    const reg = new RegExp(`^(${match})`)
    if (!reg.test(key)) {
      Reflect.deleteProperty(envConfig, key)
    }
  })
  return envConfig
}

/**
 * Get user root directory
 * @param dir file path
 */
export function getRootPath(...dir: string[]) {
  return path.resolve(process.cwd(), ...dir)
}
