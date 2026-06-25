function isDigit(char) {
  return char >= '0' && char <= '9'
}

function isNameStart(char) {
  const lower = char.toLowerCase()
  return char === '_' || (lower >= 'a' && lower <= 'z')
}

function isNameChar(char) {
  return isNameStart(char) || isDigit(char) || char === '.' || char === '-'
}

function isValidName(name) {
  if (!name || !isNameStart(name[0]))
    return false
  for (let index = 1; index < name.length; index += 1) {
    if (!isNameChar(name[index]))
      return false
  }
  return true
}

function parseFiniteNumber(token) {
  const text = token.trim().toLowerCase()
  if (!text)
    return null

  let index = 0
  if (text[index] === '+' || text[index] === '-')
    index += 1

  let digitCount = 0
  while (isDigit(text[index])) {
    digitCount += 1
    index += 1
  }

  if (text[index] === '.') {
    index += 1
    while (isDigit(text[index])) {
      digitCount += 1
      index += 1
    }
  }

  if (!digitCount)
    return null

  if (text[index] === 'e') {
    index += 1
    if (text[index] === '+' || text[index] === '-')
      index += 1

    let exponentDigits = 0
    while (isDigit(text[index])) {
      exponentDigits += 1
      index += 1
    }

    if (!exponentDigits)
      return null
  }

  if (index !== text.length)
    return null

  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

function separatorIndex(token) {
  const colonIndex = token.indexOf(':')
  const equalIndex = token.indexOf('=')
  if (colonIndex < 0)
    return equalIndex
  if (equalIndex < 0)
    return colonIndex
  return Math.min(colonIndex, equalIndex)
}

export function parsePlotterLine(line) {
  const text = String(line || '').trim()
  if (!text)
    return []

  const tokens = text
    .replace(/\s*([:=])\s*/g, '$1')
    .split(/[,\s;]+/)
    .filter(Boolean)
  const namedValues = []

  for (const token of tokens) {
    const index = separatorIndex(token)
    if (index <= 0)
      continue
    const name = token.slice(0, index)
    const value = parseFiniteNumber(token.slice(index + 1))
    if (isValidName(name) && value !== null) {
      namedValues.push({
        name,
        value,
      })
    }
  }

  if (namedValues.length)
    return namedValues

  return tokens
    .map(token => parseFiniteNumber(token))
    .filter(value => value !== null)
    .map(value => ({ value }))
}
