import { breakpointsTailwind, createGlobalState, useBreakpoints, useStorage } from '@vueuse/core'
import { ref } from 'vue'

export const DEFAULT_LAYOUT_CONFIG = Object.freeze({
  showFullScreen: true,
  showSettingPanel: true,
  showTopBar: true,
  showActivityBar: true,
  showSendPanel: true,
})

/**
 * 布局管理 Composable
 * 提供全局布局状态管理和持久化存储
 */
export const useLayout = createGlobalState(() => {
  // tailwindcss响应式断点
  const breakpoints = useBreakpoints(breakpointsTailwind)

  // 自动全屏模式断点
  const fullScreenBreakpoint = breakpoints.smaller('2xl') // 小于2xl（1536px）的屏幕默认全屏

  // 全屏状态
  const showFullScreen = useStorage('layout:showFullScreen', ref(DEFAULT_LAYOUT_CONFIG.showFullScreen))
  const toggleFullScreen = () => {
    showFullScreen.value = !showFullScreen.value
  }

  // 设置面板
  const showSettingPanel = useStorage('layout:showSettingPanel', ref(DEFAULT_LAYOUT_CONFIG.showSettingPanel))
  const toggleSettingPanel = () => {
    showSettingPanel.value = !showSettingPanel.value
  }

  // 顶部栏 - 原则上不建议隐藏，但提供接口供用户自定义
  const showTopBar = useStorage('layout:showTopBar', ref(DEFAULT_LAYOUT_CONFIG.showTopBar))
  const toggleTopBar = () => {
    showTopBar.value = !showTopBar.value
  }

  // 活动栏 - 原则上不建议隐藏，但提供接口供用户自定义
  const showActivityBar = useStorage('layout:showActivityBar', ref(DEFAULT_LAYOUT_CONFIG.showActivityBar))
  const toggleActivityBar = () => {
    showActivityBar.value = !showActivityBar.value
  }

  // 发送栏
  const showSendPanel = useStorage('layout:showSendPanel', ref(DEFAULT_LAYOUT_CONFIG.showSendPanel))
  const toggleSendPanel = () => {
    showSendPanel.value = !showSendPanel.value
  }

  // 批量更新配置 - 使用函数式编程思想，让每个配置项自己处理更新逻辑
  const updateLayoutConfig = (config) => {
    // 定义更新器函数映射 - 只需要在这里添加新的配置项
    const updaters = {
      showFullScreen: value => showFullScreen.value = value,
      showSettingPanel: value => showSettingPanel.value = value,
      showTopBar: value => showTopBar.value = value,
      showActivityBar: value => showActivityBar.value = value,
      showSendPanel: value => showSendPanel.value = value,
    }

    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && updaters[key]) {
        updaters[key](value)
      }
      else if (value !== undefined) {
        console.warn(`Unknown layout config key: ${key}`)
      }
    })
  }

  // 重置为默认配置
  const resetLayoutConfig = () => {
    updateLayoutConfig(DEFAULT_LAYOUT_CONFIG)
  }

  // 获取当前完整配置
  const getCurrentConfig = () => ({
    showFullScreen: showFullScreen.value,
    showSettingPanel: showSettingPanel.value,
    showTopBar: showTopBar.value,
    showActivityBar: showActivityBar.value,
    showSendPanel: showSendPanel.value,
  })

  return {
    // 响应式断点
    fullScreenBreakpoint,

    // 状态
    showFullScreen,
    showSettingPanel,
    showTopBar,
    showActivityBar,
    showSendPanel,

    // 全屏控制
    toggleFullScreen,

    // 设置面板控制
    toggleSettingPanel,

    // 顶部栏控制
    toggleTopBar,

    // 活动栏控制
    toggleActivityBar,

    // 发送栏控制
    toggleSendPanel,

    // 批量操作
    updateLayoutConfig,
    resetLayoutConfig,
    getCurrentConfig,
  }
})
