/**
 * Package file volume analysis
 */
import visualizer from 'rollup-plugin-visualizer'
import type { PluginOption } from 'vite'
import { isReportMode } from '../../utils'

/**
 * 根据当前模式配置并返回代码可视化工具的配置
 *
 * 此函数根据项目是否处于报告模式来决定是否生成代码大小可视化的配置
 * 在报告模式下，它会指定可视化报告的文件路径、是否在生成后自动打开、是否显示gzip压缩后的大小、
 * 以及是否显示Brotli压缩后的大小非报告模式下，返回一个空数组，表示不需要生成此类报告
 *
 * @returns {PluginOption | []} 返回代码可视化工具的配置对象或空数组
 */
export function configVisualizerConfig() {
  if (isReportMode()) {
    // 当前模式为报告模式，返回配置对象
    return visualizer({
      filename: './node_modules/.cache/visualizer/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption
  }
  // 非报告模式，返回空数组
  return []
}
