// #!/usr/bin/env node

// 一个Node.js 库，用于在终端输出中添加颜色。
import colors from 'picocolors'

import pkg from '../../package.json'
import { runBuildConfig } from './buildConf'

export async function runBuild() {
  try {
    // 用于获取Node.js 可执行文件的路径和所执行的脚本文件的路径
    const argvList = process.argv.splice(2)

    // 如果 argvList 中不包含 'disabled-config'，则生成配置文件。
    // 由于只获取了process.argv的前两个参数，所以数组中必定不含disabled-config自定义指令的，即runBuildConfig必定执行
    if (!argvList.includes('disabled-config')) {
      await runBuildConfig()
    }

    // 打印构建成功的日志信息。
    console.log(`✨ ${colors.cyan(`[${pkg.name}]`)} - build successfully!`)
  }
  catch (error) {
    // 打印构建失败的错误信息。
    console.log(colors.red(`vite build error:\n${error}`))
    // 退出进程，状态码为1，表示有错误发生。
    process.exit(1)
  }
}
runBuild()
