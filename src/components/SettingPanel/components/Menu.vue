<script setup></script>

<template>
  <div class="dropdown dropdown-top">
    <label tabindex="0" class="btn btn-square btn-ghost">
      <img src="/menu.svg" class="w-7 h-7" />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52"
    >
      <li class="menu-title">
        <span>小工具</span>
      </li>
      <a>
        <li tabindex="0">
          <label for="download-driver-modal">常见驱动下载</label>
        </li>
      </a>
      <a>
        <li tabindex="0">
          <label for="ascii-modal">ASCII码表</label>
        </li>
      </a>
      <a href="https://led.baud-dance.com/" target="_blank">
        <li tabindex="0">
          <label>LED字模生成器</label>
        </li>
      </a>
      <li class="menu-title">
        <span>设置</span>
      </li>
      <a>
        <li tabindex="0">
          <label for="setting-modal">软件设置</label>
        </li>
      </a>
    </ul>
  </div>
</template>
