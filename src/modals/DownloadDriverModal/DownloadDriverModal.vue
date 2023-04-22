<script setup>
import { computed, ref } from "vue";
const drivers = [
  {
    url: "/drivers/CH340_CH341_Windows_x64_x86.EXE",
    platform: ["windows"],
    chips: ["CH340", "CH341"],
  },
  {
    url: "/drivers/CH340_CH341_MacOS.dmg",
    platform: ["mac"],
    chips: [
      "CH340",
      "CH341",
      "CH342",
      "CH343",
      "CH344",
      "CH347",
      "CH9101",
      "CH9102",
      "CH9103",
      "CH9104",
      "CH9143",
    ],
  },
  {
    url: "/drivers/CH340_CH341_LINUX.ZIP",
    platform: ["linux"],
    chips: [
      "CH340",
      "CH341",
      "CH342",
      "CH343",
      "CH344",
      "CH347",
      "CH9101",
      "CH9102",
      "CH9103",
      "CH9104",
      "CH9143",
    ],
  },
  {
    url: "/drivers/CH343SER_Windows_x64_x86.EXE",
    platform: ["windows"],
    chips: [
      "CH342",
      "CH343",
      "CH344",
      "CH347",
      "CH9101",
      "CH9102",
      "CH9103",
      "CH9143",
    ],
  },
  {
    url: "/drivers/CP210x_Windows_Drivers_x64_x86.zip",
    platform: ["windows"],
    chips: ["CP210x"],
  },
  {
    url: "/drivers/CP210x_MAC_OSX_Driver.zip",
    platform: ["mac"],
    chips: ["CP210x"],
  },
  {
    url: "/drivers/FT232_Windows_x64_x86.exe",
    platform: ["windows"],
    chips: ["FT系列"],
  },
  {
    url: "/drivers/FT232_MacOS_10_15.zip",
    platform: ["mac"],
    chips: ["FT系列"],
  },
  {
    url: "/drivers/ftdi_sio.tar.gz",
    platform: ["linux"],
    chips: ["FT系列"],
  },
];

const platforms = [...new Set(drivers.flatMap((driver) => driver.platform))];
const chips = [...new Set(drivers.flatMap((driver) => driver.chips))].sort();

const platform = ref(undefined);
const chip = ref(undefined);

const downloadUrl = computed(() => {
  return drivers.find(
    (driver) =>
      driver.platform.includes(platform.value) &&
      driver.chips.includes(chip.value)
  )?.url;
});
</script>

<template>
  <input type="checkbox" id="download-driver-modal" class="modal-toggle" />
  <label for="download-driver-modal" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <h3 class="text-lg font-bold mb-8">常见串口驱动下载</h3>
      <div class="flex flex-col items-center gap-y-5">
        <select
          v-model="platform"
          class="select select-bordered w-full max-w-xs"
        >
          <option value="undefined" disabled selected>操作系统</option>
          <option v-for="p in platforms" :value="p">
            {{ p }}
          </option>
        </select>
        <select v-model="chip" class="select select-bordered w-full max-w-xs">
          <option value="undefined" disabled selected>芯片型号</option>
          <option v-for="c in chips" :value="c">
            {{ c }}
          </option>
        </select>
        <!-- 下载按钮 -->
        <a
          :href="downloadUrl"
          class="btn btn-primary w-full"
          :class="downloadUrl ? '' : 'btn-disabled'"
        >
          {{
            downloadUrl
              ? "下载"
              : platform && chip
              ? "抱歉，未收录此驱动，请到芯片官网寻找"
              : "请 选 择"
          }}
        </a>
      </div>
    </label>
  </label>
</template>
