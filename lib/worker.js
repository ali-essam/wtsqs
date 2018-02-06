const { SimpleLogger } = require('./utils')
const { WTSQS } = require('./wtsqs')

class WTSQSWorkerError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, WTSQSWorkerError)
  }
}

/**
 * WTSQS worker job manager.
 *
 * WTSQSWorker takes care of asynchronously fetching jobs from sqs while processing other jobs concurrently.
 *  It also takes care of deleting a job from the queue after successfully processing the message.
 *
 * @typicalname worker
 */
class WTSQSWorker {
  /**
   * Constructs WTSQSWorker object.
   * @param {Object}          options                         Options object.
   * @param {WTSQS}           options.wtsqs                   WTSQS instance to use for connecting to sqs.
   * @param {Integer}         [options.maxConcurrency=20]     Maximum number of concurrent jobs.
   * @param {Integer}         [options.pollWaitTime=5]        Duration (in seconds) for which read calls wait for a job to arrive in the queue before returning.
   * @param {Integer}         [options.visibilityTimeout=30]  Duration (in seconds) that the received jobs are hidden from subsequent retrieve requests.
   * @param {(Object|String)} [options.logger=null]                Object with trace, debug, info, warn, error methods to use for logging. Or a string with log level to use default internal logger.
   */
  constructor ({ wtsqs, maxConcurrency, pollWaitTime, visibilityTimeout, logger }) {
    if (!(wtsqs instanceof WTSQS)) throw WTSQSWorkerError('wtsqs is required')

    this.wtsqs = wtsqs
    this.maxConcurrency = maxConcurrency || 20
    this.pollWaitTime = pollWaitTime || 5
    this.visibilityTimeout = visibilityTimeout || 30

    if (!logger) this._logger = new SimpleLogger(null)
    else if (typeof logger === 'string') this._logger = new SimpleLogger(logger)
    else if (typeof logger === 'object') this._logger = logger

    this._handler = null
    this._currentConcurrency = 0
    this._minAvailableLocks = Math.min(this.maxConcurrency, 10)
  }

  /**
   * Start fetching and processing jobs.
   * @param  {AsyncFunction}  handler  Async function to process jobs.
   */
  run (handler) {
    if (this._handler) throw new WTSQSWorkerError('WTSQSWorker is already running')
    this._handler = handler
    this._workIt()
  }

  _workIt () {
    setImmediate(this._launchRequiredPolls.bind(this))
  }

  get _availableLocks () {
    return this.maxConcurrency - this._currentConcurrency
  }

  _acquireLocks (count) {
    this._logger.trace(`WTSQSWorker::_acquireLocks(${count})`)
    this._currentConcurrency += count
  }

  _releaseLocks (count) {
    this._logger.trace(`WTSQSWorker::_releaseLocks(${count})`)
    this._currentConcurrency -= count

    if (this._availableLocks >= this._minAvailableLocks) {
      this._workIt()
    }
  }

  async _launchRequiredPolls () {
    this._logger.trace('WTSQSWorker::_launchRequiredPolls')
    const pollPromises = []
    while (this._availableLocks > 0) {
      const maxJobs = Math.min(this._availableLocks, 10)
      this._acquireLocks(maxJobs)
      pollPromises.push(this._launchPoll(maxJobs))
    }
    await Promise.all(pollPromises)
  }

  async _launchPoll (maxJobs) {
    this._logger.trace(`WTSQSWorker::_launchPoll(${maxJobs})`)

    const jobs = []

    try {
      jobs.push(...(await this.wtsqs.peekMany(maxJobs,
        { pollWaitTime: this.pollWaitTime, visibilityTimeout: this.visibilityTimeout })))
    } catch (e) {
      this._logger.error('WTSQSWorker::_launchPoll', e)
    }

    this._logger.debug(`WTSQSWorker::_launchPoll.jobs.length = ${jobs.length}`)

    if (jobs.length < maxJobs) this._releaseLocks(maxJobs - jobs.length)
    if (jobs.length === 0) return

    await Promise.all(jobs.map((job) => this._processJob(job)))
  }

  async _processJob (job) {
    this._logger.debug(`WTSQSWorker::_processJob(${job})`)
    try {
      await this._handler(job)
      await this.wtsqs.deleteOne(job)
    } catch (e) {
      this._logger.warn('WTSQSWorker::_processJob', e)
    } finally {
      this._releaseLocks(1)
    }
  }
}

module.exports = {
  WTSQSWorker
}
