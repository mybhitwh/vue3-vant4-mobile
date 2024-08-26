// 导入 createProdMockServer 函数，用于创建 mock 服务器。
import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'

// 使用 import.meta.glob 导入当前文件夹下所有的 TypeScript 文件，并将这些模块作为对象存储在 modules 变量中。
const modules = import.meta.glob('./**/*.ts', { eager: true }) as any

// 创建一个空数组 mockModules 用于存储筛选后的 mock 模块。
const mockModules: any[] = []
// 通过 Object.keys(modules).forEach 遍历所有模块，忽略路径中包含 '/_' 的模块，将其他模块的默认导出内容（假设为数组）合并到 mockModules 数组中。
Object.keys(modules).forEach((key) => {
  if (key.includes('/_')) {
    return
  }
  mockModules.push(...modules[key].default)
})

/**
 * Used in a production environment. Need to manually import all modules
 */

export function setupProdMockServer() {
  // 调用 createProdMockServer 并传入 mockModules 作为参数，以设置 mock 服务器
  createProdMockServer(mockModules)
}
