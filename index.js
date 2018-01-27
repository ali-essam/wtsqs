const { SQS } = require('aws-sdk')
const UUIDv4 = require('uuid/v4')

class WTSQS {
  constructor ({
    url, accessKeyId, secretAccessKey, region,
    defaultMessageGroupId, defaultVisibilityTimeout, defaultPollWaitTime,
    sqsOptions
  }) {
    this.url = url
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.region = region || 'us-east-1'
    this.defaultMessageGroupId = defaultMessageGroupId
    this.defaultVisibilityTimeout = defaultVisibilityTimeout || 60
    this.defaultPollWaitTime = defaultPollWaitTime || 10

    this.isFIFO = this.url.endsWith('.fifo')
    this.apiVersion = '2012-11-05'

    this.sqs = new SQS({
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      region: this.region,
      apiVersion: this.apiVersion,
      ...sqsOptions
    })
  }

  async size () {
    const params = {
      QueueUrl: this.url,
      AttributeNames: ['ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible']
    }
    const resp = await this.sqs.getQueueAttributes(params)

    const size = parseInt(resp.Attributes.ApproximateNumberOfMessages) +
      parseInt(resp.Attributes.ApproximateNumberOfMessagesNotVisible, 10)

    return size
  }

  async enqueueOne (message, { messageGroupId }, sqsOptions = {}) {
    const jsonMessage = JSON.stringify(message)
    const groupId = this.isFIFO
      ? messageGroupId || this.defaultMessageGroupId || UUIDv4() : undefined
    const deduplicationId = this.isFIFO ? UUIDv4() : undefined

    const params = {
      QueueUrl: this.url,
      MessageBody: jsonMessage,
      MessageGroupId: groupId,
      MessageDeduplicationId: deduplicationId,
      ...sqsOptions
    }

    return this.sqs.sendMessage(params).promise()
  }

  async enqueueMany (messages, { messageGroupId }, sqsOptions = {}) {
    const getMessageSqsOptions = (i) => sqsOptions instanceof Array
      ? sqsOptions[i] : sqsOptions

    const enteries = messages.map((message, i) => {
      const jsonMessage = JSON.stringify(message)
      const id = UUIDv4()
      const groupId = this.isFIFO
        ? messageGroupId || this.defaultMessageGroupId || id : undefined

      return {
        Id: id,
        MessageBody: jsonMessage,
        MessageGroupId: groupId,
        MessageDeduplicationId: id,
        ...getMessageSqsOptions(i)
      }
    })

    const params = {
      QueueUrl: this.url,
      Enteries: enteries
    }

    return this.sqs.sendMessageBatch(params).promise()
  }

  async peekMany (maxNumberOfMessages = 10, { pollWaitTime, visibilityTimeout }, sqsOptions = {}) {
    const params = {
      QueueUrl: this.url,
      MaxNumberOfMessages: maxNumberOfMessages,
      WaitTimeSeconds: pollWaitTime || this.defaultPollWaitTime,
      VisibilityTimeout: visibilityTimeout || this.defaultVisibilityTimeout,
      MessageAttributeNames: ['All'],
      ...sqsOptions
    }

    const receiveResp = await this.sqs.receiveMessage(params).promise()

    if (!receiveResp.Messages) return []

    return receiveResp.Messages.map((msg) => ({
      id: msg.MessageId,
      receiptHandle: msg.ReceiptHandle,
      md5: msg.MD5OfBody,
      body: JSON.parse(msg.Body)
    }))
  }

  async peekOne ({ pollWaitTime, visibilityTimeout }, sqsOptions = {}) {
    const messages =
      await this.peekMany(1, { pollWaitTime, visibilityTimeout }, sqsOptions)
    return messages[0] || null
  }

  async deleteOne (message) {
    const params = {
      QueueUrl: this.url,
      ReceiptHandle: message.receiptHandle
    }

    return this.sqs.deleteMessage(params).promise()
  }

  async deleteMany (messages) {
    const enteries = messages.map((msg) => ({
      Id: msg.id,
      ReceiptHandle: msg.receiptHandle
    }))

    const params = {
      QueueUrl: this.url,
      Enteries: enteries
    }

    return this.sqs.deleteMessageBatch(params).promise()
  }

  async popOne (sqsOptions = {}) {
    const message = await this.peekOne(sqsOptions)

    if (!message) return null

    await this.deleteOne(message)
    return message
  }

  async popMany (maxNumberOfMessages = 10, sqsOptions = {}) {
    const messages = await this.peekOne(maxNumberOfMessages, sqsOptions)

    if (messages.length === 0) return []

    await this.deleteMany(messages)
    return messages
  }
}

class WTSQSWorker {
  constructor ({ wtsqs, maxConcurrency, handler }) {
    this.wtsqs = wtsqs
    this.maxConcurrency = maxConcurrency
    this.handler = handler

    this._currentConcurrency = 0
    this._minAvailableLocks = Math.min(this.maxConcurrency, 10)
  }

  async run () {

  }

  get _availableLocks () {
    return this.maxConcurrency - this._currentConcurrency
  }

  async _acquireLocks (count) {
    this._currentConcurrency += 1
  }

  async _releaseLocks (count) {
    this._currentConcurrency -= count

    if (this._availableLocks >= this._minAvailableLocks) {

    }
  }

  async _launchRequiredPolls () {
    while (this._availableLocks > 0) {
      const maxPollJobs = Math.min(this._availableLocks, 10)

      this._availableLocks -= maxPollJobs

      this.
    }
  }

  async _launchPoll (maxJobs) {
    const jobs = await this.wtsqs.peekMany(maxJobs)

    if (jobs.length < maxJobs) this._releaseLocks(jobs.length - maxJobs)


  }

  async _processJob (job) {
    try {
      await this.handler(job)
      await this.wtsqs.deleteOne(job)
    } catch (e) {
      console.error(e)
    } finally {
      await this._releaseLocks
    }
  }
}

module.exports = {
  WTSQS,
  WTSQSWorker
}
