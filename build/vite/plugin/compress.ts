/**
 * Used to package and output gzip. Note that this does not work properly in Vite, the specific reason is still being investigated
 * https://github.com/anncwb/vite-plugin-compression
 */
import type { PluginOption } from 'vite'

import compressPlugin from 'vite-plugin-compression'

/**
 * 配置压缩插件
 *
 * 此函数根据传入的压缩选项，生成相应的压缩插件配置
 * 支持的压缩格式有gzip、brotli和不压缩（'none'）
 * 可以选择是否在压缩后删除原文件
 *
 * @param compress 压缩类型，可以是'gzip'、'brotli'或'none'，或者它们的组合，用逗号分隔
 * @param deleteOriginFile 是否在压缩后删除原文件，默认为false
 * @returns 返回一个插件配置对象或配置对象数组
 */
export function configCompressPlugin(
  compress: 'gzip' | 'brotli' | 'none',
  deleteOriginFile = false,
): PluginOption | PluginOption[] {
  // 分割压缩类型字符串，以处理多种压缩类型
  const compressList = compress.split(',')

  // 初始化插件数组，用于存储生成的压缩插件配置
  const plugins: PluginOption[] = []

  // 如果压缩列表中包含'gzip'，则生成gzip压缩插件配置并添加到插件数组中
  if (compressList.includes('gzip')) {
    plugins.push(
      compressPlugin({
        ext: '.gz',
        deleteOriginFile,
      }),
    )
  }

  // 如果压缩列表中包含'brotli'，则生成brotli压缩插件配置并添加到插件数组中
  if (compressList.includes('brotli')) {
    plugins.push(
      compressPlugin({
        ext: '.br',
        algorithm: 'brotliCompress',
        deleteOriginFile,
      }),
    )
  }

  // 返回生成的插件配置数组
  return plugins
}
