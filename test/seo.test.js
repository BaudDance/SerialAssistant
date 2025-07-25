import node_fs from 'node:fs'
import node_path from 'node:path'
import { JSDOM } from 'jsdom'
import { beforeAll, describe, expect, it } from 'vitest'

describe('sEO Meta Tags Tests', () => {
  let dom
  let document

  beforeAll(() => {
    // 读取 index.html 文件
    const htmlPath = node_path.resolve(__dirname, '../index.html')
    const htmlContent = node_fs.readFileSync(htmlPath, 'utf-8')

    // 创建 JSDOM 实例
    dom = new JSDOM(htmlContent)
    document = dom.window.document
  })

  describe('basic SEO tags', () => {
    it('应该有正确的页面标题', () => {
      const title = document.querySelector('title')
      expect(title).toBeTruthy()
      expect(title.textContent).toBe('波特律动 串口助手 - 直接在浏览器使用的串口调试工具')
    })

    it('应该有正确的描述标签', () => {
      const description = document.querySelector('meta[name="description"]')
      expect(description).toBeTruthy()
      expect(description.getAttribute('content')).toContain('波特律动串口助手是一款直接在浏览器使用的串口调试工具')
    })

    it('应该有关键词标签', () => {
      const keywords = document.querySelector('meta[name="keywords"]')
      expect(keywords).toBeTruthy()
      expect(keywords.getAttribute('content')).toContain('串口助手,串口调试,串口工具')
    })

    it('应该有作者信息', () => {
      const author = document.querySelector('meta[name="author"]')
      expect(author).toBeTruthy()
      expect(author.getAttribute('content')).toBe('波特律动')
    })

    it('应该有正确的语言设置', () => {
      const htmlLang = document.documentElement.getAttribute('lang')
      expect(htmlLang).toBe('zh-CN')

      const metaLang = document.querySelector('meta[name="language"]')
      expect(metaLang).toBeTruthy()
      expect(metaLang.getAttribute('content')).toBe('zh-CN')
    })

    it('应该有robots标签', () => {
      const robots = document.querySelector('meta[name="robots"]')
      expect(robots).toBeTruthy()
      expect(robots.getAttribute('content')).toBe('index, follow')
    })
  })

  describe('open Graph tags', () => {
    it('应该有正确的 og:type', () => {
      const ogType = document.querySelector('meta[property="og:type"]')
      expect(ogType).toBeTruthy()
      expect(ogType.getAttribute('content')).toBe('website')
    })

    it('应该有正确的 og:url', () => {
      const ogUrl = document.querySelector('meta[property="og:url"]')
      expect(ogUrl).toBeTruthy()
      expect(ogUrl.getAttribute('content')).toBe('https://serial.baud-dance.com/')
    })

    it('应该有正确的 og:title', () => {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      expect(ogTitle).toBeTruthy()
      expect(ogTitle.getAttribute('content')).toBe('波特律动 串口助手 - 直接在浏览器使用的串口调试工具')
    })

    it('应该有正确的 og:description', () => {
      const ogDescription = document.querySelector('meta[property="og:description"]')
      expect(ogDescription).toBeTruthy()
      expect(ogDescription.getAttribute('content')).toContain('直接在浏览器使用的串口调试工具')
    })

    it('应该有正确的 og:image', () => {
      const ogImage = document.querySelector('meta[property="og:image"]')
      expect(ogImage).toBeTruthy()
      expect(ogImage.getAttribute('content')).toBe('https://serial.baud-dance.com/serial.svg')
    })

    it('应该有正确的 og:site_name', () => {
      const ogSiteName = document.querySelector('meta[property="og:site_name"]')
      expect(ogSiteName).toBeTruthy()
      expect(ogSiteName.getAttribute('content')).toBe('波特律动串口助手')
    })

    it('应该有正确的 og:locale', () => {
      const ogLocale = document.querySelector('meta[property="og:locale"]')
      expect(ogLocale).toBeTruthy()
      expect(ogLocale.getAttribute('content')).toBe('zh_CN')
    })
  })

  describe('gitHub social tags', () => {
    it('应该有 GitHub 卡片类型', () => {
      const githubCard = document.querySelector('meta[name="github:card"]')
      expect(githubCard).toBeTruthy()
      expect(githubCard.getAttribute('content')).toBe('summary_large_image')
    })

    it('应该有正确的 GitHub URL', () => {
      const githubUrl = document.querySelector('meta[name="github:url"]')
      expect(githubUrl).toBeTruthy()
      expect(githubUrl.getAttribute('content')).toBe('https://github.com/BaudDance/SerialAssistant')
    })

    it('应该有正确的 GitHub 标题', () => {
      const githubTitle = document.querySelector('meta[name="github:title"]')
      expect(githubTitle).toBeTruthy()
      expect(githubTitle.getAttribute('content')).toBe('波特律动 串口助手 - 直接在浏览器使用的串口调试工具')
    })

    it('应该有正确的 GitHub 图片', () => {
      const githubImage = document.querySelector('meta[name="github:image"]')
      expect(githubImage).toBeTruthy()
      expect(githubImage.getAttribute('content')).toBe('https://serial.baud-dance.com/serial.svg')
    })
  })

  describe('bilibili social tags', () => {
    it('应该有 Bilibili 卡片类型', () => {
      const bilibiliCard = document.querySelector('meta[name="bilibili:card"]')
      expect(bilibiliCard).toBeTruthy()
      expect(bilibiliCard.getAttribute('content')).toBe('summary_large_image')
    })

    it('应该有正确的 Bilibili URL', () => {
      const bilibiliUrl = document.querySelector('meta[name="bilibili:url"]')
      expect(bilibiliUrl).toBeTruthy()
      expect(bilibiliUrl.getAttribute('content')).toBe('https://space.bilibili.com/6100925')
    })

    it('应该有正确的 Bilibili 标题', () => {
      const bilibiliTitle = document.querySelector('meta[name="bilibili:title"]')
      expect(bilibiliTitle).toBeTruthy()
      expect(bilibiliTitle.getAttribute('content')).toBe('波特律动 串口助手 - 直接在浏览器使用的串口调试工具')
    })

    it('应该有正确的 Bilibili 图片', () => {
      const bilibiliImage = document.querySelector('meta[name="bilibili:image"]')
      expect(bilibiliImage).toBeTruthy()
      expect(bilibiliImage.getAttribute('content')).toBe('https://serial.baud-dance.com/serial.svg')
    })
  })

  describe('other SEO tags', () => {
    it('应该有主题色设置', () => {
      const themeColor = document.querySelector('meta[name="theme-color"]')
      expect(themeColor).toBeTruthy()
      expect(themeColor.getAttribute('content')).toBe('#1f2937')
    })

    it('应该有应用名称', () => {
      const appName = document.querySelector('meta[name="application-name"]')
      expect(appName).toBeTruthy()
      expect(appName.getAttribute('content')).toBe('波特律动串口助手')
    })

    it('应该有 Apple Web App 设置', () => {
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      expect(appleTitle).toBeTruthy()
      expect(appleTitle.getAttribute('content')).toBe('串口助手')

      const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
      expect(appleCapable).toBeTruthy()
      expect(appleCapable.getAttribute('content')).toBe('yes')
    })

    it('应该有 canonical 链接', () => {
      const canonical = document.querySelector('link[rel="canonical"]')
      expect(canonical).toBeTruthy()
      expect(canonical.getAttribute('href')).toBe('https://serial.baud-dance.com/')
    })
  })

  describe('structured data', () => {
    it('应该有正确的 JSON-LD 结构化数据', () => {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]')
      expect(jsonLdScript).toBeTruthy()

      const jsonData = JSON.parse(jsonLdScript.textContent)
      expect(jsonData['@context']).toBe('https://schema.org')
      expect(jsonData['@type']).toBe('WebApplication')
      expect(jsonData.name).toBe('波特律动串口助手')
      expect(jsonData.description).toContain('直接在浏览器使用的串口调试工具')
      expect(jsonData.url).toBe('https://serial.baud-dance.com/')
      expect(jsonData.applicationCategory).toBe('DeveloperApplication')
      expect(jsonData.operatingSystem).toBe('Web Browser')
      expect(jsonData.offers.price).toBe('0')
      expect(jsonData.offers.priceCurrency).toBe('CNY')
      expect(jsonData.author.name).toBe('波特律动')
    })
  })

  describe('icons and manifest', () => {
    it('应该有正确的图标链接', () => {
      const icon = document.querySelector('link[rel="icon"]')
      expect(icon).toBeTruthy()
      expect(icon.getAttribute('href')).toBe('/serial.svg')
      expect(icon.getAttribute('type')).toBe('image/svg+xml')
    })

    it('应该有清单文件链接', () => {
      const manifest = document.querySelector('link[rel="manifest"]')
      expect(manifest).toBeTruthy()
      expect(manifest.getAttribute('href')).toBe('/manifest.json')
    })
  })

  describe('hTML structure', () => {
    it('应该有正确的文档类型', () => {
      expect(dom.window.document.doctype.name).toBe('html')
    })

    it('应该有正确的字符编码', () => {
      const charset = document.querySelector('meta[charset]')
      expect(charset).toBeTruthy()
      expect(charset.getAttribute('charset')).toBe('UTF-8')
    })

    it('应该有正确的视口设置', () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      expect(viewport).toBeTruthy()
      expect(viewport.getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
    })

    it('应该有应用容器元素', () => {
      const app = document.querySelector('#app')
      expect(app).toBeTruthy()
    })

    it('应该有主脚本引用', () => {
      const script = document.querySelector('script[src="/src/main.js"]')
      expect(script).toBeTruthy()
      expect(script.getAttribute('type')).toBe('module')
    })
  })
})
