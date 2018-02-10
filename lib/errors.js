class InvalidArgument extends Error {
  constructor (...args) {
    super(...args)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class WTSQSWorkerError extends Error {
  constructor (...args) {
    super(...args)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = {
  InvalidArgument,
  WTSQSWorkerError
}
