import { useSupported } from "@vueuse/core";
import { computed, ref } from "vue";

export function useBle(
  options = {
    onReadFrame: (data) => {},
  }
) {
  const { onReadFrame } = options;
  const isSupported = useSupported(
    async () =>
      navigator &&
      "bluetooth" in navigator &&
      (await navigator.bluetooth.getAvailability())
  );

  const bluetooth = navigator.bluetooth;
  const device = ref(undefined);
  const deviceName = computed(() => device.value?.name);
  const server = ref(undefined);
  const writeCharacteristic = ref(undefined);
  const state = ref("disconnected"); // disconnected, connecting, connected, disconnecting
  const connected = ref(false);

  async function requestDevice(type) {
    // const ops = options || {
    //   acceptAllDevices: true,
    //   optionalServices: [0xffe0],
    // };
    const d = await bluetooth.requestDevice({
      filters: [{ services: [type.service] }],
    });
    if (d) {
      device.value = d;
    }
    console.log("requestDevice", d);
    return d;
  }

  async function connectDevice(type) {
    console.log("connectDevice", device.value);
    if (!device.value) return;
    try {
      server.value = await device.value.gatt.connect();
      console.log("server", server.value);
      state.value = "connected";
      connected.value = true;

      // 添加断开连接事件
      device.value.addEventListener("gattserverdisconnected", onDisconnected);
      listenCharacteristic(type);
    } catch (e) {
      console.log(e);
    }
  }

  async function listenCharacteristic(type) {
    const service = await server.value.getPrimaryService(type.service);
    console.log("service", service);
    const characteristic = await service.getCharacteristic(
      type.notifyCharacteristic
    );
    console.log("characteristic", characteristic);
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event) => {
      const value = event.target.value;
      console.log(
        "characteristicvaluechanged",
        value.buffer,
        typeof value.buffer
      );
      onReadFrame(new Uint8Array(value.buffer));
    });

    writeCharacteristic.value = await service.getCharacteristic(
      type.writeCharacteristic
    );
  }

  async function sendHex(data) {
    if (!writeCharacteristic.value) return;
    await writeCharacteristic.value.writeValueWithoutResponse(data);
  }

  async function onDisconnected() {
    console.log("gattserverdisconnected", event);
    state.value = "disconnected";
    connected.value = false;
  }

  async function disconnectDevice() {
    if (!device.value) return;
    await device.value.gatt.disconnect();
  }
  return {
    device,
    deviceName,
    connected,
    requestDevice,
    connectDevice,
    disconnectDevice,
    sendHex,
  };
}
