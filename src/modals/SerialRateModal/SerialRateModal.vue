<script setup>
import { ref } from "vue";
import { useSerialStore } from "@/store/useSerialStore";
const { serialRate, defaultBaudRateList, baudRateList } = useSerialStore();

const newBaudRate = ref("");

function addNewBaudRate() {
    if (newBaudRate.value == "") return;
    if (baudRateList.value.includes(newBaudRate.value)) return;
    baudRateList.value.push(newBaudRate.value);
}

function canDelete(rate) {
    if (!canDelete(rate)) return;
    return !defaultBaudRateList.includes(rate);
}

function deleteRate(rate) {
    baudRateList.value.splice(baudRateList.value.indexOf(rate), 1);
}

</script>
<template>
    <dialog id="serialrate_modal" class="modal">
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
        <form method="dialog" class="modal-box">
            <div class="flex flex-col ">
                <div class="flex gap-2 justify-center flex-wrap">
                    <div class="badge badge-outline group" v-for="r in baudRateList" data-tip="点击删除"
                        :class="canDelete(r) ? 'tooltip cursor-pointer' : 'badge-accent'" @click="() => deleteRate(r)">
                        {{ r }}
                    </div>
                </div>
                <div class="h-5"></div>
                <div class="flex justify-center">
                    <input v-model="newBaudRate" type="text" placeholder="输入自定义波特律"
                        class="input input-bordered  input-sm" />
                    <div class="w-5"></div>
                    <div class="btn btn-success btn-sm" @click="addNewBaudRate">添加</div>
                </div>
            </div>
        </form>
    </dialog>
</template>
