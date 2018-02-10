const { SQS } = require('aws-sdk')
const safeJsonStringify = require('safe-json-stringify')
const UUIDv4 = require('uuid/v4')

const { InvalidArgument } = require('./errors')

/**
 * Received SQS Message
 * @typedef  {Object} Message
 * @property {String} id            Message id.
 * @property {String} receiptHandle Message receipt handle.
 * @property {String} md5           Message body md5 hash sum.
 * @property {Object} body          Message body containing original payload.
 */

/**
 * A simplified sqs wrapper with interface similar to a normal queue data structure.
 *
 * @typicalname wtsqs
 *
 * @example
 * const { WTSQS } = require('wtsqs')
 *
 * // The most simple way to construct a WTSQS object
 * const wtsqs = new WTSQS({
 *   url: '//queue-url',
 *   accessKeyId: 'AWS_ACCESS_KEY_ID',
 *   secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
 * })
 */
class WTSQS {
  /**
   * Constructs WTSQS object.
   * @param {Object}  options                                Options object.
   * @param {String}  options.url                            SQS queue url.
   * @param {String}  options.accessKeyId                    AWS access key id.
   * @param {String}  options.secretAccessKey                AWS secret access key.
   * @param {String}  [options.region=us-east-1]             AWS regions where queue exists.
   * @param {String}  [options.defaultMessageGroupId]        FIFO queues only. Default tag assigned to a message that specifies it belongs to a specific message group. If not provided random uuid is assigned to each message which doesn't guarantee order but allows parallelism.
   * @param {Integer} [options.defaultVisibilityTimeout=60]  Default duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
   * @param {Integer} [options.defaultPollWaitTime=10]       Default duration (in seconds) for which read calls wait for a message to arrive in the queue before returning.
   * @param {Object}  [options.sqsOptions]                   Additional options to extend/override the underlying SQS object creation.
   */
  constructor ({
    url, accessKeyId, secretAccessKey, region,
    defaultMessageGroupId, defaultVisibilityTimeout, defaultPollWaitTime,
    sqsOptions
  }) {
    if (url === undefined) throw new InvalidArgument('url required')
    if (accessKeyId === undefined) throw new InvalidArgument('accessKeyId required')
    if (secretAccessKey === undefined) throw new InvalidArgument('secretAccessKey required')

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

  /**
   * Get approximate total number of messages in the queue.
   * @return {Promise<integer>}
   *
   * @example
   * const size = await wtsqs.size()
   * console.log(size) // output: 2
   */
  async size () {
    const params = {
      QueueUrl: this.url,
      AttributeNames: ['ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible']
    }
    const resp = await this.sqs.getQueueAttributes(params).promise()

    const size = parseInt(resp.Attributes.ApproximateNumberOfMessages) +
      parseInt(resp.Attributes.ApproximateNumberOfMessagesNotVisible, 10)

    return size
  }

  /**
   * Enqueue single payload in the queue.
   * @param  {Object}  payload                   JSON serializable object.
   * @param  {Object}  [options]                 Options.
   * @param  {String}  [options.messageGroupId]  Message group id to override default id.
   * @param  {Object}  [sqsOptions={}]           Additional options to extend/override the underlying SQS sendMessage request.
   * @return {Promise}
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property|SQS#sendMessage}
   *
   * @example
   * const myObj = { a: 1 }
   * await wtsqs.enqueueOne(myObj)
   */
  async enqueueOne (payload, { messageGroupId } = {}, sqsOptions = {}) {
    if (payload === undefined) throw new InvalidArgument('payload is required')

    const jsonPayload = safeJsonStringify(payload)
    const groupId = this.isFIFO
      ? messageGroupId || this.defaultMessageGroupId || UUIDv4() : undefined
    const deduplicationId = this.isFIFO ? UUIDv4() : undefined

    const params = {
      QueueUrl: this.url,
      MessageBody: jsonPayload,
      MessageGroupId: groupId,
      MessageDeduplicationId: deduplicationId,
      ...sqsOptions
    }

    return this.sqs.sendMessage(params).promise()
  }

  /**
   * Enqueue batch of payloads in the queue.
   * @param  {Array<Object>}         payloads                  Array of JSON serializable objects.
   * @param  {Object}                [options]                 Options object.
   * @param  {String}                [options.messageGroupId]  Message group id to override default id.
   * @param  {Object}                [sqsOptions={}]           Additional options to extend/override the underlying SQS sendMessageBatch request.
   * @return {Promise}
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessageBatch-property|SQS#sendMessageBatch}
   *
   * @example
   * const myObjList = [{ a: 1 }, { b: 3 }]
   * await wtsqs.enqueueMany(myObjList)
   */
  async enqueueMany (payloads, { messageGroupId } = {}, sqsOptions = {}) {
    if (!(payloads instanceof Array)) throw new InvalidArgument('payloads must be of type array')

    const entries = payloads.map((payload) => {
      const jsonPayload = safeJsonStringify(payload)
      const id = UUIDv4()
      const groupId = this.isFIFO
        ? messageGroupId || this.defaultMessageGroupId || id : undefined

      return {
        Id: id,
        MessageBody: jsonPayload,
        MessageGroupId: groupId,
        MessageDeduplicationId: id,
        ...sqsOptions
      }
    })

    const params = {
      QueueUrl: this.url,
      Entries: entries
    }

    return this.sqs.sendMessageBatch(params).promise()
  }

  /**
   * Retrieve single message without deleting it.
   * @param  {Object}   [options]                    Options object.
   * @param  {Integer}  [options.pollWaitTime]       Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
   * @param  {Integer}  [options.visibilityTimeout]  Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
   * @param  {Object}   [sqsOptions={}]              Additional options to extend/override the underlying SQS receiveMessage request.
   * @return {Promise<Message|null>}                 Message object or null if queue is empty.
   *
   * @example
   * const myMessage = await wtsqs.peekOne()
   * console.log(myMessage)
   * // output:
   * {
   *   id: 'messageId',
   *   receiptHandle: 'messageReceiptHandle'
   *   md5: 'messageMD5',
   *   body: { a: 1 }
   * }
   */
  async peekOne ({ pollWaitTime, visibilityTimeout } = {}, sqsOptions = {}) {
    const messages =
      await this.peekMany(1, { pollWaitTime, visibilityTimeout }, sqsOptions)
    return messages[0] || null
  }

  /**
   * Retrieve batch of messages without deleting them.
   * @param  {Number}   [maxNumberOfMessages=10]     Maximum number of messages to retrieve. Must be between 1 and 10.
   * @param  {Object}   [options]                    Options object.
   * @param  {Integer}  [options.pollWaitTime]       Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
   * @param  {Integer}  [options.visibilityTimeout]  Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
   * @param  {Object}   [sqsOptions={}]              Additional options to extend/override the underlying SQS receiveMessage request.
   * @return {Promise<Array<Message>>}               Array of retrieved messages.
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property|SQS#receiveMessage}
   *
   * @example
   * const myMessageList = await wtsqs.peekMany(2)
   * console.log(myMessageList)
   * // output:
   * [
   *  {
   *    id: 'messageId',
   *    receiptHandle: 'messageReceiptHandle'
   *    md5: 'messageMD5',
   *    body: { a: 1 }
   *  },
   *  {
   *    id: 'messageId',
   *    receiptHandle: 'messageReceiptHandle'
   *    md5: 'messageMD5',
   *    body: { b: 3 }
   *  }
   * ]
   */
  async peekMany (maxNumberOfMessages = 10, { pollWaitTime, visibilityTimeout } = {}, sqsOptions = {}) {
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

  /**
   * Delete single message from queue.
   * @param  {Message}  message  Message to be deleted
   * @return {Promise}
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property|SQS#deleteMessage}
   *
   * @example
   * const myMessage = await wtsqs.peekOne()
   * await wtsqs.deleteOne(myMessage)
   */
  async deleteOne (message) {
    const params = {
      QueueUrl: this.url,
      ReceiptHandle: message.receiptHandle
    }

    return this.sqs.deleteMessage(params).promise()
  }

  /**
   * Delete batch of messages from queue.
   * @param  {Array<Message>}  messages  Messages to be deleted
   * @return {Promise}
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessageBatch-property|SQS#deleteMessageBatch}
   *
   * @example
   * const myMessageList = await wtsqs.peekMany(2)
   * await wtsqs.deleteMany(myMessageList)
   */
  async deleteMany (messages) {
    const entries = messages.map((msg) => ({
      Id: msg.id,
      ReceiptHandle: msg.receiptHandle
    }))

    const params = {
      QueueUrl: this.url,
      Entries: entries
    }

    return this.sqs.deleteMessageBatch(params).promise()
  }

  /**
   * Delete ALL messages in the queue.
   *
   * NOTE: Can only be called once every 60 seconds.
   *
   * @return {Promise}
   *
   * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#purgeQueue-property|SQS#purgeQueue}
   *
   * @example
   * await wtsqs.deleteAll()
   */
  async deleteAll () {
    const params = {
      QueueUrl: this.url
    }

    await this.sqs.purgeQueue(params).promise()
  }

  /**
   * Retrieve single message and immediately delete it.
   * @param  {Object}   [options]                    Options object.
   * @param  {Integer}  [options.pollWaitTime]       Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
   * @param  {Integer}  [options.visibilityTimeout]  Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
   * @param  {Object}   [sqsOptions={}]              Additional options to extend/override the underlying SQS receiveMessage request.
   * @return {Promise<Message|null>}                 Message object or null if queue is empty.
   *
   * @example
   * const myMessage = await wtsqs.popOne()
   * // The message no longer exists in queue
   * console.log(myMessage)
   * // output:
   * {
   *   id: 'messageId',
   *   receiptHandle: 'messageReceiptHandle'
   *   md5: 'messageMD5',
   *   body: { a: 1 }
   * }
   */
  async popOne ({ pollWaitTime, visibilityTimeout } = {}, sqsOptions = {}) {
    const message = await this.peekOne({ pollWaitTime, visibilityTimeout }, sqsOptions)

    if (!message) return null

    await this.deleteOne(message)
    return message
  }

  /**
   * Retrieve batch of messages and immediately delete them.
   * @param  {Number}   [maxNumberOfMessages=10]     Maximum number of messages to retrieve. Must be between 1 and 10.
   * @param  {Object}   [options]                    Options object.
   * @param  {Integer}  [options.pollWaitTime]       Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
   * @param  {Integer}  [options.visibilityTimeout]  Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
   * @param  {Object}   [sqsOptions={}]              Additional options to extend/override the underlying SQS receiveMessage request.
   * @return {Promise<Array<Message>>}               Array of retrieved messages.
   *
   * @example
   * const myMessageList = await wtsqs.popMany(2)
   * // Messages no longer exist in queue
   * console.log(myMessageList)
   * // output:
   * [
   *  {
   *    id: 'messageId',
   *    receiptHandle: 'messageReceiptHandle'
   *    md5: 'messageMD5',
   *    body: { a: 1 }
   *  },
   *  {
   *    id: 'messageId',
   *    receiptHandle: 'messageReceiptHandle'
   *    md5: 'messageMD5',
   *    body: { b: 3 }
   *  }
   * ]
   */
  async popMany (maxNumberOfMessages = 10, { pollWaitTime, visibilityTimeout } = {}, sqsOptions = {}) {
    const messages = await this.peekMany(maxNumberOfMessages, { pollWaitTime, visibilityTimeout }, sqsOptions)

    if (messages.length === 0) return []

    await this.deleteMany(messages)
    return messages
  }
}

module.exports = {
  WTSQS
}
