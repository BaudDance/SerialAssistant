import USBJson from "@/assets/usb-device.json";
import { useSupported, useTimeoutFn } from "@vueuse/core";
import { computed, shallowRef } from "vue";
/**
 *  Get device name from USBJson
 * @param {SerialPort} port
 * @returns
 */
function getDeviceName(port) {
  if (!port) return undefined;
  const { usbProductId, usbVendorId } = port.getInfo();
  if (!usbVendorId) return undefined;
  const vendor = USBJson[usbVendorId.toString(16).padStart(4, "0")];
  if (!vendor) return undefined;
  const product = vendor.devices[usbProductId.toString(16).padStart(4, "0")];
  console.debug("getDeviceName", product ? product.name : undefined);
  return product ? product.devname : undefined;
}

export function useSerial(
  options = {
    onReadData: (data) => {},
    onReadFrame: (frame) => {},
  }
) {
  const { onReadData, onReadFrame } = options;
  const isSupported = useSupported(() => navigator && "serial" in navigator);
  const serial = navigator.serial;
  const port = shallowRef(undefined);
  const portName = computed(() => getDeviceName(port.value));
  const ports = shallowRef([]);

  function updatePorts() {
    serial.getPorts().then((ports) => {
      ports.value = ports;
    });
  }

  async function requestPort() {
    const p = await serial.requestPort(options);
    if (p) {
      port.value = p;
      updatePorts();
    }
  }

  function setPort(p) {
    port.value = p;
  }

  async function startReadLoop() {
    let buffer = new Uint8Array();
    const { start, stop } = useTimeoutFn(
      () => {
        onReadFrame(buffer);
        buffer = new Uint8Array();
      },
      20,
      { immediate: false }
    );
    while (port.value.readable) {
      const reader = port.value.readable.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (value) {
            stop();
            buffer = new Uint8Array([...buffer, ...value]);
            onReadData(value);
            start();
          }
          if (done) {
            reader.releaseLock();
            break;
          }
        }
        reader.releaseLock();
      } catch (error) {
        console.error(error);
        reader.releaseLock();
      }
    }
    console.log("串口读取循环已关闭");
  }

  async function openPort(options = { baudRate: 9600 }) {
    console.log("打开串口", options);
    await port.value.open({ baudRate: 9600 });
    startReadLoop();
  }

  async function sendHex(hexBuffer) {
    const writer = port.value.writable.getWriter();
    console.log("发送数据", hexBuffer);
    await writer.write(hexBuffer);

    // 允许稍后关闭串口。
    writer.releaseLock();
  }

  updatePorts();
  return {
    isSupported,
    requestPort,
    setPort,
    port,
    portName,
    ports,
    openPort,
    sendHex,
  };
}
