export function normalizeTerminalInput(input, terminalEnter) {
  return input === '\r' ? terminalEnter : input
}
