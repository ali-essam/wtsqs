# WTSQS

[![npm version](https://badge.fury.io/js/wtsqs.svg)](https://www.npmjs.com/package/wtsqs)
[![Build Status](https://travis-ci.org/ali-essam/wtsqs.svg?branch=master)](https://travis-ci.org/ali-essam/wtsqs)
[![Coverage Status](https://coveralls.io/repos/github/ali-essam/wtsqs/badge.svg)](https://coveralls.io/github/ali-essam/wtsqs)
[![Dependencies](https://david-dm.org/ali-essam/wtsqs/status.svg)](https://david-dm.org/ali-essam/wtsqs)
[![Dev Dependencies](https://david-dm.org/ali-essam/wtsqs/dev-status.svg)](https://david-dm.org/ali-essam/wtsqs?type=dev)

Simplified SQS Wrapper and Async Worker manager.


Features:
- Simple interface. :white_check_mark:
- Promise based. :white_check_mark:
- ES6. :white_check_mark:
- Optimized async worker. :white_check_mark:

## Install

```sh
# Using npm
$ npm install wtsqs --save

# Or using yarn
$ yarn add wtsqs
```

## Classes

<dl>
<dt><a href="#WTSQS">WTSQS</a></dt>
<dd><p>A simplified sqs wrapper with interface similar to a normal queue data structure.</p>
</dd>
<dt><a href="#WTSQSWorker">WTSQSWorker</a></dt>
<dd><p>WTSQS worker job manager.</p>
<p>WTSQSWorker takes care of asynchronously fetching jobs from sqs while processing other jobs concurrently.
 It also takes care of deleting a job from the queue after successfully processing the message.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Message">Message</a> : <code>Object</code></dt>
<dd><p>Received SQS Message</p>
</dd>
<dt><a href="#Job">Job</a> : <code>Object</code></dt>
<dd><p>Worker Job</p>
</dd>
</dl>

<a name="WTSQS"></a>

## WTSQS
A simplified sqs wrapper with interface similar to a normal queue data structure.

**Kind**: global class  

* [WTSQS](#WTSQS)
    * [new WTSQS(options)](#new_WTSQS_new)
    * [.size()](#WTSQS+size) ⇒ <code>Promise.&lt;integer&gt;</code>
    * [.enqueueOne(payload, [options], [sqsOptions])](#WTSQS+enqueueOne) ⇒ <code>Promise</code>
    * [.enqueueMany(payloads, [options], [sqsOptions])](#WTSQS+enqueueMany) ⇒ <code>Promise</code>
    * [.peekOne([options], [sqsOptions])](#WTSQS+peekOne) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
    * [.peekMany([maxNumberOfMessages], [options], [sqsOptions])](#WTSQS+peekMany) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
    * [.deleteOne(message)](#WTSQS+deleteOne) ⇒ <code>Promise</code>
    * [.deleteMany(messages)](#WTSQS+deleteMany) ⇒ <code>Promise</code>
    * [.deleteAll()](#WTSQS+deleteAll) ⇒ <code>Promise</code>
    * [.popOne([options], [sqsOptions])](#WTSQS+popOne) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
    * [.popMany([maxNumberOfMessages], [options], [sqsOptions])](#WTSQS+popMany) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>


* * *

<a name="new_WTSQS_new"></a>

### new WTSQS(options)
Constructs WTSQS object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options object. |
| options.url | <code>String</code> |  | SQS queue url. |
| [options.accessKeyId] | <code>String</code> |  | AWS access key id. |
| [options.secretAccessKey] | <code>String</code> |  | AWS secret access key. |
| [options.region] | <code>String</code> | <code>us-east-1</code> | AWS regions where queue exists. |
| [options.defaultMessageGroupId] | <code>String</code> |  | FIFO queues only. Default tag assigned to a message that specifies it belongs to a specific message group. If not provided random uuid is assigned to each message which doesn't guarantee order but allows parallelism. |
| [options.defaultVisibilityTimeout] | <code>Integer</code> | <code>60</code> | Default duration (in seconds) that the received messages are hidden from subsequent retrieve requests. |
| [options.defaultPollWaitTime] | <code>Integer</code> | <code>10</code> | Default duration (in seconds) for which read calls wait for a message to arrive in the queue before returning. |
| [options.sqsOptions] | <code>Object</code> |  | Additional options to extend/override the underlying SQS object creation. |

**Example**  
```js
const { WTSQS } = require('wtsqs')

// The most simple way to construct a WTSQS object
const wtsqs = new WTSQS({
  url: '//queue-url',
  accessKeyId: 'AWS_ACCESS_KEY_ID',
  secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
})
```

* * *

<a name="WTSQS+size"></a>

### wtsqs.size() ⇒ <code>Promise.&lt;integer&gt;</code>
Get approximate total number of messages in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Example**  
```js
const size = await wtsqs.size()
console.log(size) // output: 2
```

* * *

<a name="WTSQS+enqueueOne"></a>

### wtsqs.enqueueOne(payload, [options], [sqsOptions]) ⇒ <code>Promise</code>
Enqueue single payload in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**See**: [SQS#sendMessage](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessage-property)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| payload | <code>Object</code> |  | JSON serializable object. |
| [options] | <code>Object</code> |  | Options. |
| [options.messageGroupId] | <code>String</code> |  | Message group id to override default id. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS sendMessage request. |

**Example**  
```js
const myObj = { a: 1 }
await wtsqs.enqueueOne(myObj)
```

* * *

<a name="WTSQS+enqueueMany"></a>

### wtsqs.enqueueMany(payloads, [options], [sqsOptions]) ⇒ <code>Promise</code>
Enqueue batch of payloads in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**See**: [SQS#sendMessageBatch](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#sendMessageBatch-property)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| payloads | <code>Array.&lt;Object&gt;</code> |  | Array of JSON serializable objects. |
| [options] | <code>Object</code> |  | Options object. |
| [options.messageGroupId] | <code>String</code> |  | Message group id to override default id. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS sendMessageBatch request. |

**Example**  
```js
const myObjList = [{ a: 1 }, { b: 3 }]
await wtsqs.enqueueMany(myObjList)
```

* * *

<a name="WTSQS+peekOne"></a>

### wtsqs.peekOne([options], [sqsOptions]) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
Retrieve single message without deleting it.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;(Message\|null)&gt;</code> - Message object or null if queue is empty.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Options object. |
| [options.pollWaitTime] | <code>Integer</code> |  | Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages. |
| [options.visibilityTimeout] | <code>Integer</code> |  | Duration (in seconds) that the received messages are hidden from subsequent retrieve requests. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS receiveMessage request. |

**Example**  
```js
const myMessage = await wtsqs.peekOne()
console.log(myMessage)
// output:
{
  id: 'messageId',
  receiptHandle: 'messageReceiptHandle'
  md5: 'messageMD5',
  body: { a: 1 }
}
```

* * *

<a name="WTSQS+peekMany"></a>

### wtsqs.peekMany([maxNumberOfMessages], [options], [sqsOptions]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Retrieve batch of messages without deleting them.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Array of retrieved messages.  
**See**: [SQS#receiveMessage](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [maxNumberOfMessages] | <code>Number</code> | <code>10</code> | Maximum number of messages to retrieve. Must be between 1 and 10. |
| [options] | <code>Object</code> |  | Options object. |
| [options.pollWaitTime] | <code>Integer</code> |  | Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages. |
| [options.visibilityTimeout] | <code>Integer</code> |  | Duration (in seconds) that the received messages are hidden from subsequent retrieve requests. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS receiveMessage request. |

**Example**  
```js
const myMessageList = await wtsqs.peekMany(2)
console.log(myMessageList)
// output:
[
 {
   id: 'messageId',
   receiptHandle: 'messageReceiptHandle'
   md5: 'messageMD5',
   body: { a: 1 }
 },
 {
   id: 'messageId',
   receiptHandle: 'messageReceiptHandle'
   md5: 'messageMD5',
   body: { b: 3 }
 }
]
```

* * *

<a name="WTSQS+deleteOne"></a>

### wtsqs.deleteOne(message) ⇒ <code>Promise</code>
Delete single message from queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**See**: [SQS#deleteMessage](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessage-property)  

| Param | Type | Description |
| --- | --- | --- |
| message | [<code>Message</code>](#Message) | Message to be deleted |

**Example**  
```js
const myMessage = await wtsqs.peekOne()
await wtsqs.deleteOne(myMessage)
```

* * *

<a name="WTSQS+deleteMany"></a>

### wtsqs.deleteMany(messages) ⇒ <code>Promise</code>
Delete batch of messages from queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**See**: [SQS#deleteMessageBatch](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#deleteMessageBatch-property)  

| Param | Type | Description |
| --- | --- | --- |
| messages | [<code>Array.&lt;Message&gt;</code>](#Message) | Messages to be deleted |

**Example**  
```js
const myMessageList = await wtsqs.peekMany(2)
await wtsqs.deleteMany(myMessageList)
```

* * *

<a name="WTSQS+deleteAll"></a>

### wtsqs.deleteAll() ⇒ <code>Promise</code>
Delete ALL messages in the queue.

NOTE: Can only be called once every 60 seconds.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**See**: [SQS#purgeQueue](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#purgeQueue-property)  
**Example**  
```js
await wtsqs.deleteAll()
```

* * *

<a name="WTSQS+popOne"></a>

### wtsqs.popOne([options], [sqsOptions]) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
Retrieve single message and immediately delete it.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;(Message\|null)&gt;</code> - Message object or null if queue is empty.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Options object. |
| [options.pollWaitTime] | <code>Integer</code> |  | Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages. |
| [options.visibilityTimeout] | <code>Integer</code> |  | Duration (in seconds) that the received messages are hidden from subsequent retrieve requests. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS receiveMessage request. |

**Example**  
```js
const myMessage = await wtsqs.popOne()
// The message no longer exists in queue
console.log(myMessage)
// output:
{
  id: 'messageId',
  receiptHandle: 'messageReceiptHandle'
  md5: 'messageMD5',
  body: { a: 1 }
}
```

* * *

<a name="WTSQS+popMany"></a>

### wtsqs.popMany([maxNumberOfMessages], [options], [sqsOptions]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Retrieve batch of messages and immediately delete them.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Array of retrieved messages.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [maxNumberOfMessages] | <code>Number</code> | <code>10</code> | Maximum number of messages to retrieve. Must be between 1 and 10. |
| [options] | <code>Object</code> |  | Options object. |
| [options.pollWaitTime] | <code>Integer</code> |  | Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages. |
| [options.visibilityTimeout] | <code>Integer</code> |  | Duration (in seconds) that the received messages are hidden from subsequent retrieve requests. |
| [sqsOptions] | <code>Object</code> | <code>{}</code> | Additional options to extend/override the underlying SQS receiveMessage request. |

**Example**  
```js
const myMessageList = await wtsqs.popMany(2)
// Messages no longer exist in queue
console.log(myMessageList)
// output:
[
 {
   id: 'messageId',
   receiptHandle: 'messageReceiptHandle'
   md5: 'messageMD5',
   body: { a: 1 }
 },
 {
   id: 'messageId',
   receiptHandle: 'messageReceiptHandle'
   md5: 'messageMD5',
   body: { b: 3 }
 }
]
```

* * *

<a name="WTSQSWorker"></a>

## WTSQSWorker
WTSQS worker job manager.

WTSQSWorker takes care of asynchronously fetching jobs from sqs while processing other jobs concurrently.
 It also takes care of deleting a job from the queue after successfully processing the message.

**Kind**: global class  

* [WTSQSWorker](#WTSQSWorker)
    * [new WTSQSWorker(options)](#new_WTSQSWorker_new)
    * _instance_
        * [.run(handler)](#WTSQSWorker+run)
        * [.shutdown()](#WTSQSWorker+shutdown) ⇒ <code>Promise</code>
    * _inner_
        * [~runHandler](#WTSQSWorker..runHandler) ⇒ <code>Promise</code>


* * *

<a name="new_WTSQSWorker_new"></a>

### new WTSQSWorker(options)
Constructs WTSQSWorker object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | Options object. |
| options.wtsqs | [<code>WTSQS</code>](#WTSQS) |  | WTSQS instance to use for connecting to sqs. |
| [options.maxConcurrency] | <code>Integer</code> | <code>20</code> | Maximum number of concurrent jobs. |
| [options.pollWaitTime] | <code>Integer</code> | <code>5</code> | Duration (in seconds) for which read calls wait for a job to arrive in the queue before returning. |
| [options.visibilityTimeout] | <code>Integer</code> | <code>30</code> | Duration (in seconds) that the received jobs are hidden from subsequent retrieve requests. |
| [options.logger] | <code>Object</code> \| <code>String</code> | <code></code> | Object with debug, info, warn, error methods to use for logging. Or a string with log level to use default internal logger. |

**Example**  
```js
const { WTSQS, WTSQSWorker } = require('wtsqs')

const wtsqs = new WTSQS({
  url: '//queue-url',
  accessKeyId: 'AWS_ACCESS_KEY_ID',
  secretAccessKey: 'AWS_SECRET_ACCESS_KEY'
})

const worker = new WTSQSWorker({ wtsqs })

worker.run(async (job) => {
 await someAsyncFunction(job.body)
 console.log(job)
})
```

* * *

<a name="WTSQSWorker+run"></a>

### worker.run(handler)
Start fetching and processing jobs.

**Kind**: instance method of [<code>WTSQSWorker</code>](#WTSQSWorker)  

| Param | Type | Description |
| --- | --- | --- |
| handler | [<code>runHandler</code>](#WTSQSWorker..runHandler) | Async function to process a single job. |


* * *

<a name="WTSQSWorker+shutdown"></a>

### worker.shutdown() ⇒ <code>Promise</code>
Shutsdown the worker and drain active jobs.

**Kind**: instance method of [<code>WTSQSWorker</code>](#WTSQSWorker)  
**Returns**: <code>Promise</code> - Resolves when all active jobs have been drained.  

* * *

<a name="WTSQSWorker..runHandler"></a>

### WTSQSWorker~runHandler ⇒ <code>Promise</code>
Async callback function to process single job.

**Kind**: inner typedef of [<code>WTSQSWorker</code>](#WTSQSWorker)  

| Param | Type | Description |
| --- | --- | --- |
| job | [<code>Job</code>](#Job) | A single job to process |


* * *

<a name="Message"></a>

## Message : <code>Object</code>
Received SQS Message

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Message id. |
| receiptHandle | <code>String</code> | Message receipt handle. |
| md5 | <code>String</code> | Message body md5 hash sum. |
| body | <code>Object</code> | Message body containing original payload. |


* * *

<a name="Job"></a>

## Job : <code>Object</code>
Worker Job

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | Job id. |
| receiptHandle | <code>String</code> | Job receipt handle. |
| md5 | <code>String</code> | Job body md5 hash sum. |
| body | <code>Object</code> | Job body containing original payload. |


* * *

