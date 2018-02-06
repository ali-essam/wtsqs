# WTSQS

Simplified SQS Wrapper and Async Worker manager.

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

<a name="WTSQS"></a>

## WTSQS
A simplified sqs wrapper with interface similar to a normal queue data structure.

**Kind**: global class  

* [WTSQS](#WTSQS)
    * [new WTSQS(options)](#new_WTSQS_new)
    * [.size()](#WTSQS+size) ⇒ <code>Promise.&lt;integer&gt;</code>
    * [.enqueueOne(payload, [options], [sqsOptions])](#WTSQS+enqueueOne) ⇒ <code>Promise</code>
    * [.enqueueMany(payloads, [options], [sqsOptions])](#WTSQS+enqueueMany) ⇒ <code>Promise</code>
    * [.peekMany([maxNumberOfMessages], [options], [sqsOptions])](#WTSQS+peekMany) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
    * [.peekOne([options], [sqsOptions])](#WTSQS+peekOne) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
    * [.deleteOne(message)](#WTSQS+deleteOne) ⇒ <code>Promise</code>
    * [.deleteMany(messages)](#WTSQS+deleteMany) ⇒ <code>Promise</code>
    * [.popOne([options], [sqsOptions])](#WTSQS+popOne) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
    * [.popMany([maxNumberOfMessages], [options], [sqsOptions])](#WTSQS+popMany) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>


* * *

<a name="new_WTSQS_new"></a>

### new WTSQS(options)
Constructs WTSQS object.

**Params**

- options <code>Object</code> - Options object.
    - .url <code>String</code> - SQS queue url.
    - .accessKeyId <code>String</code> - AWS access key id.
    - .secretAccessKey <code>String</code> - AWS secret access key.
    - [.region] <code>String</code> <code> = us-east-1</code> - AWS regions where queue exists.
    - [.defaultMessageGroupId] <code>String</code> - FIFO queues only. Default tag assigned to a message that specifies it belongs to a specific message group. If not provided random uuid is assigned to each message which doesn't guarantee order but allows parallelism.
    - [.defaultVisibilityTimeout] <code>Integer</code> <code> = 60</code> - Default duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
    - [.defaultPollWaitTime] <code>Integer</code> <code> = 10</code> - Default duration (in seconds) for which read calls wait for a message to arrive in the queue before returning.
    - [.sqsOptions] <code>Object</code> - Additional options to extend/override the underlying SQS object creation.


* * *

<a name="WTSQS+size"></a>

### wtsqs.size() ⇒ <code>Promise.&lt;integer&gt;</code>
Get approximate total number of messages in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  

* * *

<a name="WTSQS+enqueueOne"></a>

### wtsqs.enqueueOne(payload, [options], [sqsOptions]) ⇒ <code>Promise</code>
Enqueue single payload in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Params**

- payload <code>Object</code> - JSON serializable object.
- [options] <code>Object</code> - Options.
    - [.messageGroupId] <code>String</code> - Message group id to override default id.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS sendMessage request.


* * *

<a name="WTSQS+enqueueMany"></a>

### wtsqs.enqueueMany(payloads, [options], [sqsOptions]) ⇒ <code>Promise</code>
Enqueue batch of payloads in the queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Params**

- payloads <code>Array.&lt;Object&gt;</code> - Array of JSON serializable objects.
- [options] <code>Object</code> - Options object.
    - [.messageGroupId] <code>String</code> - Message group id to override default id.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS sendMessageBatch request.


* * *

<a name="WTSQS+peekMany"></a>

### wtsqs.peekMany([maxNumberOfMessages], [options], [sqsOptions]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Retrieve batch of messages without deleting them.

Each message consists of `id`, `receiptHandle`, `md5`, and `body`.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Array of retrieved messages.  
**Params**

- [maxNumberOfMessages] <code>Number</code> <code> = 10</code> - Maximum number of messages to retrieve. Must be between 1 and 10.
- [options] <code>Object</code> - Options object.
    - [.pollWaitTime] <code>Integer</code> - Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
    - [.visibilityTimeout] <code>Integer</code> - Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS receiveMessage request.


* * *

<a name="WTSQS+peekOne"></a>

### wtsqs.peekOne([options], [sqsOptions]) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
Retrieve single message without deleting it.

A message consists of `id`, `receiptHandle`, `md5`, and `body`.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;(Message\|null)&gt;</code> - Message object or null if queue is empty.  
**Params**

- [options] <code>Object</code> - Options object.
    - [.pollWaitTime] <code>Integer</code> - Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
    - [.visibilityTimeout] <code>Integer</code> - Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS receiveMessage request.


* * *

<a name="WTSQS+deleteOne"></a>

### wtsqs.deleteOne(message) ⇒ <code>Promise</code>
Delete single message from queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Params**

- message <code>Message</code> - Message to be deleted


* * *

<a name="WTSQS+deleteMany"></a>

### wtsqs.deleteMany(messages) ⇒ <code>Promise</code>
Delete batch of messages from queue.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Params**

- messages <code>Array.&lt;Message&gt;</code> - Messages to be deleted


* * *

<a name="WTSQS+popOne"></a>

### wtsqs.popOne([options], [sqsOptions]) ⇒ <code>Promise.&lt;(Message\|null)&gt;</code>
Retrieve single message and immediately delete it.

A message consists of `id`, `receiptHandle`, `md5`, and `body`.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;(Message\|null)&gt;</code> - Message object or null if queue is empty.  
**Params**

- [options] <code>Object</code> - Options object.
    - [.pollWaitTime] <code>Integer</code> - Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
    - [.visibilityTimeout] <code>Integer</code> - Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS receiveMessage request.


* * *

<a name="WTSQS+popMany"></a>

### wtsqs.popMany([maxNumberOfMessages], [options], [sqsOptions]) ⇒ <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code>
Retrieve batch of messages and immediately delete them.

Each message consists of `id`, `receiptHandle`, `md5`, and `body`.

**Kind**: instance method of [<code>WTSQS</code>](#WTSQS)  
**Returns**: <code>Promise.&lt;Array.&lt;Message&gt;&gt;</code> - Array of retrieved messages.  
**Params**

- [maxNumberOfMessages] <code>Number</code> <code> = 10</code> - Maximum number of messages to retrieve. Must be between 1 and 10.
- [options] <code>Object</code> - Options object.
    - [.pollWaitTime] <code>Integer</code> - Duration (in seconds) for which read call waits for a message to arrive in the queue before returning. If no messages are available and the wait time expires, the call returns successfully with an empty list of messages.
    - [.visibilityTimeout] <code>Integer</code> - Duration (in seconds) that the received messages are hidden from subsequent retrieve requests.
- [sqsOptions] <code>Object</code> <code> = {}</code> - Additional options to extend/override the underlying SQS receiveMessage request.


* * *

<a name="WTSQSWorker"></a>

## WTSQSWorker
WTSQS worker job manager.

WTSQSWorker takes care of asynchronously fetching jobs from sqs while processing other jobs concurrently.
 It also takes care of deleting a job from the queue after successfully processing the message.

**Kind**: global class  

* [WTSQSWorker](#WTSQSWorker)
    * [new WTSQSWorker(options)](#new_WTSQSWorker_new)
    * [.run(handler)](#WTSQSWorker+run)


* * *

<a name="new_WTSQSWorker_new"></a>

### new WTSQSWorker(options)
Constructs WTSQSWorker object.

**Params**

- options <code>Object</code> - Options object.
    - .wtsqs [<code>WTSQS</code>](#WTSQS) - WTSQS instance to use for connecting to sqs.
    - [.maxConcurrency] <code>Integer</code> <code> = 20</code> - Maximum number of concurrent jobs.
    - [.pollWaitTime] <code>Integer</code> <code> = 5</code> - Duration (in seconds) for which read calls wait for a job to arrive in the queue before returning.
    - [.visibilityTimeout] <code>Integer</code> <code> = 30</code> - Duration (in seconds) that the received jobs are hidden from subsequent retrieve requests.
    - [.logger] <code>Object</code> | <code>String</code> <code> = </code> - Object with trace, debug, info, warn, error methods to use for logging. Or a string with log level to use default internal logger.


* * *

<a name="WTSQSWorker+run"></a>

### worker.run(handler)
Start fetching and processing jobs.

**Kind**: instance method of [<code>WTSQSWorker</code>](#WTSQSWorker)  
**Params**

- handler <code>AsyncFunction</code> - Async function to process jobs.


* * *

