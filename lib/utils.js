class SimpleLogger {
  constructor (level) {
    this._levels = {
      fatal: 100,
      error: 200,
      warn: 300,
      info: 400,
      debug: 500,
      trace: 600
    }

    if (!level) this._level = 0
    else this._level = this._levels[level]
  }

  log (level, ...args) {
    if (this._levels[level] <= this._level) console.log(`(${level})`, ...args)
  }

  fatal (...args) { this.log('fatal', ...args) }

  error (...args) { this.log('error', ...args) }

  warn (...args) { this.log('warn', ...args) }

  info (...args) { this.log('info', ...args) }

  debug (...args) { this.log('debug', ...args) }
}

const flatten = (arr) => Array.prototype.concat(...arr)

const chunk = (arr, size) => {
  // Adapted from lodash

  if (!arr.length || size < 1) return []
  let index = 0
  let resIndex = 0
  const result = new Array(Math.ceil(arr.length / size))

  while (index < arr.length) {
    result[resIndex++] = arr.slice(index, (index += size))
  }
  return result
}

const chunkNumber = (n, x) => {
  const result = (new Array(parseInt(n / x)).fill(x))
  if (n % x) result.push(n % x)
  return result
}

module.exports = {
  SimpleLogger,
  flatten,
  chunk,
  chunkNumber
}
