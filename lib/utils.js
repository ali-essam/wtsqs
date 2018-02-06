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
  trace (...args) { this.log('trace', ...args) }
}

module.exports = {
  SimpleLogger
}
