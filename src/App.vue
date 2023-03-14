<script setup></script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="container aspect-video flex flex-nowrap">
      <div
        class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl p-5 flex flex-col"
      >
        <select class="select select-bordered w-full max-w-xs">
          <option disabled selected>选择端口</option>
          <option>COM1</option>
          <option>COM2</option>
        </select>
        <div class="h-3"></div>
        <select class="select select-bordered w-full max-w-xs">
          <option disabled>设置波特率</option>
          <option selected value="9600">波特率: 9600</option>
          <option value="19200">波特率: 19200</option>
          <option value="38400">波特率: 38400</option>
          <option value="57600">波特率: 57600</option>
          <option value="115200">波特率: 115200</option>
        </select>
        <div class="h-3"></div>
        <select class="select select-bordered w-full max-w-xs">
          <option disabled>设置数据位</option>
          <option selected value="8">数据位: 8</option>
          <option value="7">数据位: 7</option>
          <option value="6">数据位: 6</option>
          <option value="5">数据位: 5</option>
        </select>
        <div class="h-3"></div>
        <select class="select select-bordered w-full max-w-xs">
          <option disabled>设置校验位</option>
          <option selected value="None">校验位: None</option>
          <option selected value="Even">校验位: Even</option>
          <option selected value="Odd">校验位: Odd</option>
          <option selected value="Mark">校验位: Mark</option>
          <option selected value="Space">校验位: Space</option>
        </select>
        <div class="h-3"></div>
        <select class="select select-bordered w-full max-w-xs">
          <option disabled>设置停止位</option>
          <option selected value="1">停止位: 1</option>
          <option selected value="1.5">停止位: 1.5</option>
          <option selected value="2">停止位: 2</option>
        </select>
        <div class="h-3"></div>
        <button class="btn">连 接</button>
      </div>
      <div class="w-14"></div>
      <div class="flex flex-col flex-grow">
        <div
          class="basis-3/4 border-solid border-2 border-gray-400 rounded-3xl"
        >
          <div class="chat chat-start">
            <div class="chat-header">
              <time class="text-xs opacity-50">00:12:45 hex</time>
            </div>
            <div class="chat-bubble">
              0x01 0x03 0x00 0x00 0x00 0x01 0x84 0x0A
            </div>
          </div>
        </div>
        <div class="h-8"></div>
        <div
          class="basis-1/4 border-solid border-2 border-gray-400 rounded-3xl"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
