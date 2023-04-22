import USBJson from "@/assets/usb-device.json";
import { useSupported, useTimeoutFn } from "@vueuse/core";
import { computed, ref } from "vue";
/**
 *  Get device name from USBJson
 * @param {SerialPort} port
 * @returns
 */
export function getDeviceName(port) {
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
  const port = ref(undefined);
  const portName = computed(() => getDeviceName(port.value));
  const ports = ref([]);
  const connected = ref(false);
  let keepReading;
  let readingClosed;
  async function updatePorts() {
    ports.value = await serial.getPorts();
  }

  async function requestPort() {
    const p = await serial.requestPort(options);
    if (p) {
      port.value = p;
      updatePorts();
    }
    return p;
  }

  function setPort(p) {
    port.value = p;
  }
  let reader;
  async function startReadLoop() {
    let buffer = new Uint8Array();
    const { start, stop } = useTimeoutFn(
      () => {
        onReadFrame(buffer);
        buffer = new Uint8Array();
      },
      5,
      { immediate: false }
    );
    keepReading = true;
    while (port.value.readable && keepReading) {
      reader = port.value.readable.getReader();
      try {
        while (keepReading) {
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
      } catch (error) {
        console.error(error);
      } finally {
        reader.releaseLock();
      }
    }
  }

  async function openPort(options = { baudRate: 9600 }) {
    await port.value.open(options);
    readingClosed = startReadLoop();
    connected.value = true;
  }

  async function reopenPort(options = { baudRate: 9600 }) {
    await closePort();
    await openPort(options);
  }

  async function closePort() {
    keepReading = false;
    reader?.cancel();
    await readingClosed;
    await port.value.close();
    connected.value = false;
  }
  async function sendHex(hexBuffer) {
    const writer = port.value.writable.getWriter();
    await writer.write(hexBuffer);

    // 允许稍后关闭串口。
    writer.close();
    writer.releaseLock();
  }

  serial.addEventListener("disconnect", async (event) => {
    if (port.value == event.target) {
      await closePort();
    }
  });

  updatePorts();
  return {
    isSupported,
    requestPort,
    setPort,
    port,
    portName,
    ports,
    openPort,
    reopenPort,
    closePort,
    sendHex,
    connected,
  };
}
