import { HttpsProxyAgent } from "https-proxy-agent"

export function parseProxyUrl(proxy: string): string {
  let p = proxy.trim()

  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p
  }

  const parts = p.split(":")

  if (parts.length === 4) {
    const [ip, port, user, pass] = parts
    return `http://${user}:${pass}@${ip}:${port}`
  }

  if (parts.length === 2) {
    const [ip, port] = parts
    return `http://${ip}:${port}`
  }

  if (p.includes("@")) {
    return `http://${p}`
  }

  return `http://${p}`
}

export function getProxyAgent(proxy?: string | null) {
  if (!proxy) return undefined
  try {
    const url = parseProxyUrl(proxy)
    return new HttpsProxyAgent(url)
  } catch {
    return undefined
  }
}
