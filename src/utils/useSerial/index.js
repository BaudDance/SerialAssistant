import USBJson from "@/assets/usb-device.json";
import { useSupported } from "@vueuse/core";
import { computed, ref, shallowRef } from "vue";
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

export function useSerial(options = {}) {
  const isSupported = useSupported(() => navigator && "serial" in navigator);
  const serial = navigator.serial;
  const port = ref(undefined);
  const portName = computed(() => getDeviceName(port.value));
  const ports = shallowRef([]);

  function updatePorts() {
    serial.getPorts().then((ports) => {
      ports.value = ports;
    });
  }

  const requestPort = async () => {
    const p = await serial.requestPort(options);
    if (p) {
      port.value = p;
      updatePorts();
    }
  };

  const setPort = (p) => {
    port.value = p;
  };

  updatePorts();
  return { isSupported, requestPort, setPort, port, portName, ports };
}
