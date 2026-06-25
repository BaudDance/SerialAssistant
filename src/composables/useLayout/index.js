import { breakpointsTailwind, createGlobalState, useBreakpoints, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export const DEFAULT_LAYOUT_CONFIG = Object.freeze({
  workspaceMode: 'record',
  showFullScreen: true,
  showTerminalMode: false,
  showPlotterMode: false,
  showSettingPanel: true,
  showQuickInputPanel: true,
  showTopBar: true,
  showActivityBar: true,
  showSendPanel: true,
})

const WORKSPACE_MODES = ['record', 'plotter', 'terminal']

function normalizeWorkspaceMode(mode) {
  return WORKSPACE_MODES.includes(mode) ? mode : DEFAULT_LAYOUT_CONFIG.workspaceMode
}

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
  const showFullScreen = useLocalStorage(
    'layout:showFullScreen',
    ref(DEFAULT_LAYOUT_CONFIG.showFullScreen),
    { listenToStorageChanges: false },
  )
  const toggleFullScreen = () => {
    showFullScreen.value = !showFullScreen.value
  }

  const legacyShowTerminalMode = useLocalStorage(
    'layout:showTerminalMode',
    ref(DEFAULT_LAYOUT_CONFIG.showTerminalMode),
    { listenToStorageChanges: false },
  )

  // 工作区模式
  const workspaceMode = useLocalStorage(
    'layout:workspaceMode',
    ref(legacyShowTerminalMode.value ? 'terminal' : DEFAULT_LAYOUT_CONFIG.workspaceMode),
    { listenToStorageChanges: false },
  )
  workspaceMode.value = normalizeWorkspaceMode(workspaceMode.value)

  function setWorkspaceMode(mode) {
    workspaceMode.value = normalizeWorkspaceMode(mode)
  }

  // 终端模式兼容层
  const showTerminalMode = computed({
    get: () => workspaceMode.value === 'terminal',
    set: (value) => {
      workspaceMode.value = value ? 'terminal' : 'record'
    },
  })

  const showPlotterMode = computed({
    get: () => workspaceMode.value === 'plotter',
    set: (value) => {
      workspaceMode.value = value ? 'plotter' : 'record'
    },
  })

  watch(workspaceMode, (mode) => {
    const normalized = normalizeWorkspaceMode(mode)
    if (normalized !== mode) {
      workspaceMode.value = normalized
      return
    }
    legacyShowTerminalMode.value = normalized === 'terminal'
  }, { immediate: true })

  const toggleTerminalMode = () => {
    workspaceMode.value = showTerminalMode.value ? 'record' : 'terminal'
  }
  const togglePlotterMode = () => {
    workspaceMode.value = showPlotterMode.value ? 'record' : 'plotter'
  }

  // 设置面板
  const showSettingPanel = useLocalStorage(
    'layout:showSettingPanel',
    ref(DEFAULT_LAYOUT_CONFIG.showSettingPanel),
    { listenToStorageChanges: false },
  )
  const toggleSettingPanel = () => {
    showSettingPanel.value = !showSettingPanel.value
  }

  // 快捷输入面板
  const showQuickInputPanel = useLocalStorage(
    'layout:showQuickInputPanel',
    ref(DEFAULT_LAYOUT_CONFIG.showQuickInputPanel),
    { listenToStorageChanges: false },
  )
  const toggleQuickInputPanel = () => {
    showQuickInputPanel.value = !showQuickInputPanel.value
  }

  // 顶部栏 - 原则上不建议隐藏，但提供接口供用户自定义
  const showTopBar = useLocalStorage(
    'layout:showTopBar',
    ref(DEFAULT_LAYOUT_CONFIG.showTopBar),
    { listenToStorageChanges: false },
  )
  const toggleTopBar = () => {
    showTopBar.value = !showTopBar.value
  }

  // 活动栏 - 原则上不建议隐藏，但提供接口供用户自定义
  const showActivityBar = useLocalStorage(
    'layout:showActivityBar',
    ref(DEFAULT_LAYOUT_CONFIG.showActivityBar),
    { listenToStorageChanges: false },
  )
  const toggleActivityBar = () => {
    showActivityBar.value = !showActivityBar.value
  }

  // 发送栏
  const showSendPanel = useLocalStorage(
    'layout:showSendPanel',
    ref(DEFAULT_LAYOUT_CONFIG.showSendPanel),
    { listenToStorageChanges: false },
  )
  const toggleSendPanel = () => {
    showSendPanel.value = !showSendPanel.value
  }

  // 批量更新配置 - 使用函数式编程思想，让每个配置项自己处理更新逻辑
  const updateLayoutConfig = (config) => {
    // 定义更新器函数映射 - 只需要在这里添加新的配置项
    const updaters = {
      workspaceMode: setWorkspaceMode,
      showFullScreen: value => showFullScreen.value = value,
      showTerminalMode: value => showTerminalMode.value = value,
      showPlotterMode: value => showPlotterMode.value = value,
      showSettingPanel: value => showSettingPanel.value = value,
      showQuickInputPanel: value => showQuickInputPanel.value = value,
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
    workspaceMode: workspaceMode.value,
    showFullScreen: showFullScreen.value,
    showTerminalMode: showTerminalMode.value,
    showPlotterMode: showPlotterMode.value,
    showSettingPanel: showSettingPanel.value,
    showQuickInputPanel: showQuickInputPanel.value,
    showTopBar: showTopBar.value,
    showActivityBar: showActivityBar.value,
    showSendPanel: showSendPanel.value,
  })

  return {
    // 响应式断点
    fullScreenBreakpoint,

    // 状态
    workspaceMode,
    showFullScreen,
    showTerminalMode,
    showPlotterMode,
    showSettingPanel,
    showQuickInputPanel,
    showTopBar,
    showActivityBar,
    showSendPanel,

    // 全屏控制
    toggleFullScreen,

    // 终端模式控制
    setWorkspaceMode,
    toggleTerminalMode,
    togglePlotterMode,

    // 设置面板控制
    toggleSettingPanel,

    // 快捷输入面板控制
    toggleQuickInputPanel,

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
