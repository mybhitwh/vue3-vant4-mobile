/**
 * Used to parse the .env.development proxy configuration
 */
import type { ProxyOptions } from 'vite'

type ProxyItem = [string, string]

type ProxyList = ProxyItem[]

type ProxyTargetList = Record<string, ProxyOptions & { rewrite: (path: string) => string }>

// js正则表达式语法
const httpsRE = /^https:\/\//

/**
 * 生成代理
 * @param list 代理数组，通过.env文件的VITE_PROXY环境变量定义
 */
export function createProxy(list: ProxyList = []) {
  const ret: ProxyTargetList = {}
  for (const [prefix, target] of list) {
    // 判断代理地址是否是https协议
    const isHttps = httpsRE.test(target)

    // https://github.com/http-party/node-http-proxy#options
    ret[prefix] = {
      target,
      changeOrigin: true,
      ws: true,
      rewrite: path => path.replace(new RegExp(`^${prefix}`), ''),
      // https is require secure=false
      // 如果您secure="true"只允许来自 HTTPS 的请求，则secure="false"意味着允许来自 HTTP 和 HTTPS 的请求。
      ...(isHttps ? { secure: false } : {}),
    }
  }

  return ret

  // ret
  // {
  //   '/test/api': {
  //     target: 'http://localhost:3080/test/api',
  //     changeOrigin: true,
  //     ws: true,
  //     rewrite: (path) => path.replace(new RegExp(/^\/test/api/), ''),
  //   },
  //   '/upload': {
  //     target: 'http://localhost:8001/upload',
  //     changeOrigin: true,
  //     ws: true,
  //     rewrite: (path) => path.replace(new RegExp(/^\/upload/), ''),
  //   }
  // }
}
