<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { dialogKeys, useDialog } from './composable'

const { visible } = useDialog()

const ascii = [
  {
    binary: '00000000',
    decimal: '0',
    hex: '0x00',
    char: 'NUL (Null)',
    desc: '空字符',
  },
  {
    binary: '00000001',
    decimal: '1',
    hex: '0x01',
    char: 'SOH (Start of Heading)',
    desc: '标题开始',
  },
  {
    binary: '00000010',
    decimal: '2',
    hex: '0x02',
    char: 'STX (Start of Text)',
    desc: '正文开始',
  },
  {
    binary: '00000011',
    decimal: '3',
    hex: '0x03',
    char: 'ETX (End of Text)',
    desc: '正文结束',
  },
  {
    binary: '00000100',
    decimal: '4',
    hex: '0x04',
    char: 'EOT (End of Transmission)',
    desc: '传输结束',
  },
  {
    binary: '00000101',
    decimal: '5',
    hex: '0x05',
    char: 'ENQ (Enquiry)',
    desc: '询问',
  },
  {
    binary: '00000110',
    decimal: '6',
    hex: '0x06',
    char: 'ACK (Acknowledgment)',
    desc: '确认',
  },
  {
    binary: '00000111',
    decimal: '7',
    hex: '0x07',
    char: 'BEL (Bell)',
    desc: '响铃',
  },
  {
    binary: '00001000',
    decimal: '8',
    hex: '0x08',
    char: 'BS (Backspace)',
    desc: '退格',
  },
  {
    binary: '00001001',
    decimal: '9',
    hex: '0x09',
    char: 'HT (Horizontal Tab)',
    desc: '水平制表符',
  },
  {
    binary: '00001010',
    decimal: '10',
    hex: '0x0A',
    char: 'LF (Line Feed)',
    desc: '换行键',
  },
  {
    binary: '00001011',
    decimal: '11',
    hex: '0x0B',
    char: 'VT (Vertical Tab)',
    desc: '垂直制表符',
  },
  {
    binary: '00001100',
    decimal: '12',
    hex: '0x0C',
    char: 'FF (Form Feed)',
    desc: '换页键',
  },
  {
    binary: '00001101',
    decimal: '13',
    hex: '0x0D',
    char: 'CR (Carriage Return)',
    desc: '回车键',
  },
  {
    binary: '00001110',
    decimal: '14',
    hex: '0x0E',
    char: 'SO (Shift Out)',
    desc: '不用切换',
  },
  {
    binary: '00001111',
    decimal: '15',
    hex: '0x0F',
    char: 'SI (Shift In)',
    desc: '启用切换',
  },
  {
    binary: '00010000',
    decimal: '16',
    hex: '0x10',
    char: 'DLE (Data Link Escape)',
    desc: '数据链路转义',
  },
  {
    binary: '00010001',
    decimal: '17',
    hex: '0x11',
    char: 'DC1 (Device Control 1)',
    desc: '设备控制1',
  },
  {
    binary: '00010010',
    decimal: '18',
    hex: '0x12',
    char: 'DC2 (Device Control 2)',
    desc: '设备控制2',
  },
  {
    binary: '00010011',
    decimal: '19',
    hex: '0x13',
    char: 'DC3 (Device Control 3)',
    desc: '设备控制3',
  },
  {
    binary: '00010100',
    decimal: '20',
    hex: '0x14',
    char: 'DC4 (Device Control 4)',
    desc: '设备控制4',
  },
  {
    binary: '00010101',
    decimal: '21',
    hex: '0x15',
    char: 'NAK (Negative Acknowledgment)',
    desc: '否认确认',
  },
  {
    binary: '00010110',
    decimal: '22',
    hex: '0x16',
    char: 'SYN (Synchronous Idle)',
    desc: '同步空闲',
  },
  {
    binary: '00010111',
    decimal: '23',
    hex: '0x17',
    char: 'ETB (End of Transmission Block)',
    desc: '传输块结束',
  },
  {
    binary: '00011000',
    decimal: '24',
    hex: '0x18',
    char: 'CAN (Cancel)',
    desc: '取消',
  },
  {
    binary: '00011001',
    decimal: '25',
    hex: '0x19',
    char: 'EM (End of Medium)',
    desc: '介质中断',
  },
  {
    binary: '00011010',
    decimal: '26',
    hex: '0x1A',
    char: 'SUB (Substitute)',
    desc: '替换',
  },
  {
    binary: '00011011',
    decimal: '27',
    hex: '0x1B',
    char: 'ESC (Escape)',
    desc: '转义',
  },
  {
    binary: '00011100',
    decimal: '28',
    hex: '0x1C',
    char: 'FS (File Separator)',
    desc: '文件分隔符',
  },
  {
    binary: '00011101',
    decimal: '29',
    hex: '0x1D',
    char: 'GS (Group Separator)',
    desc: '组分隔符',
  },
  {
    binary: '00011110',
    decimal: '30',
    hex: '0x1E',
    char: 'RS (Record Separator)',
    desc: '记录分隔符',
  },
  {
    binary: '00011111',
    decimal: '31',
    hex: '0x1F',
    char: 'US (Unit Separator)',
    desc: '单元分隔符',
  },
  {
    binary: '00100000',
    decimal: '32',
    hex: '0x20',
    char: '<Space>',
    desc: '空格',
    visible: true,
  },
  ...Array.from({ length: 95 })
    .fill(0)
    .map((_, i) => {
      const decimal = i + 32
      const hex = decimal.toString(16).toUpperCase()
      const char = String.fromCharCode(decimal)
      return {
        binary: decimal.toString(2).padStart(8, '0'),
        decimal: decimal.toString(),
        hex: `0x${hex}`,
        char,
        desc: '',
        visible: true,
      }
    }),
  {
    binary: '01111111',
    decimal: '127',
    hex: '0x7F',
    char: 'DEL (Delete)',
    desc: '删除',
  },
]
</script>

<template>
  <Dialog v-model:open="visible[dialogKeys.ascii]">
    <DialogContent class="sm:max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] max-h-[90dvh] p-0">
      <DialogHeader class="px-6 pt-6">
        <DialogTitle>ASCII码表</DialogTitle>
        <DialogDescription>
          常用ASCII码与控制字符对照表
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="px-6">
        <Table>
          <TableCaption />

          <TableHeader>
            <TableRow>
              <TableHead>二进制</TableHead>
              <TableHead>十进制</TableHead>
              <TableHead>十六进制</TableHead>
              <TableHead>字符<span class="text-orange-700">(橙色为可显示字符)</span></TableHead>
              <TableHead class="text-right">
                描述
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody class="overflow-y-scroll">
            <TableRow v-for="item in ascii" :key="item.decimal">
              <TableCell> {{ item.binary }}</TableCell>
              <TableCell>{{ item.decimal }}</TableCell>
              <TableCell>{{ item.hex }}</TableCell>
              <TableCell :class="item.visible ? 'text-orange-700' : ''">
                {{ item.char }}
              </TableCell>
              <TableCell class="text-right">
                {{ item.desc }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
      <DialogFooter />
    </DialogContent>
  </Dialog>
</template>
