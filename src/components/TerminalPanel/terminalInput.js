export function normalizeTerminalInput(input, terminalEnter) {
  return input === '\r' ? terminalEnter : input
}

export function shouldCopySelection(event, hasSelection) {
  return hasSelection
    && event.type === 'keydown'
    && event.key.toLowerCase() === 'c'
    && (event.ctrlKey || event.metaKey)
    && !event.altKey
    && !event.shiftKey
}
