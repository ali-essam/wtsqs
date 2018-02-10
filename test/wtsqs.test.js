// setup chai
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const sleep = require('sleep-promise')

const { WTSQS } = require('../')

describe('WTSQS', () => {
  const wtsqs = new WTSQS({
    url: process.env.AWS_SQS_URL,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    defaultPollWaitTime: 1
  })

  describe('#size()', () => {
    it('should return number', async function () {
      await sleep(1000)
      const size = await wtsqs.size()
      expect(size).to.be.a('number')
    })
  })

  describe('#enqueueOne()', () => {
    it('should fail if no payload', async function () {
      try {
        await wtsqs.enqueueOne()
      } catch (e) {
        expect(e.name).to.equal('InvalidArgument')
      }
    })

    it('should increase queue size by one', async function () {
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      const payload = {}
      await wtsqs.enqueueOne(payload)
      await sleep(1000)
      const sizeAfter = await wtsqs.size()
      expect(sizeAfter).to.equal(sizeBefore + 1)
    })
  })

  describe('#enqueueMany()', () => {
    it('should fail if payload is not array', async function () {
      try {
        await wtsqs.enqueueMany({})
      } catch (e) {
        expect(e.name).to.equal('InvalidArgument')
      }
    })

    it('should increase queue size by enqueued count', async function () {
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      const payloads = [{}, {}]
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const sizeAfter = await wtsqs.size()
      expect(sizeAfter).to.equal(sizeBefore + payloads.length)
    })

    it('should allow enqueuing more than 10 messages', async function () {
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      const payloads = new Array(25).fill({})
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const sizeAfter = await wtsqs.size()
      expect(sizeAfter).to.equal(sizeBefore + payloads.length)
    })
  })

  describe('#peekOne()', () => {
    it('should return valid Message object', async function () {
      const payload = { rick: 'I turned myself into js object, morty!' }
      await wtsqs.enqueueOne(payload)
      await sleep(1000)
      const message = await wtsqs.peekOne()
      expect(message).to.be.an('object')
        .that.has.all.keys('id', 'receiptHandle', 'md5', 'body')
    })

    it('should not affect queue size', async function () {
      const payload = { rick: 'Look at me morty!' }
      await wtsqs.enqueueOne(payload)
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.peekOne()
      await sleep(1000)
      const sizeAfter = await wtsqs.size()
      expect(sizeAfter).to.equal(sizeBefore)
    })
  })

  describe('#peekMany', () => {
    it('should return array of valid Message objects', async function () {
      const payloads = [{}, {}, {}]
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const messages = await wtsqs.peekMany()
      expect(messages).to.be.an('array')
      for (const message of messages) {
        expect(message).to.be.an('object')
          .that.has.all.keys('id', 'receiptHandle', 'md5', 'body')
      }
    })

    it('should not affect queue size', async function () {
      const payloads = [{}, {}, {}]
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.peekMany()
      await sleep(1000)
      const sizeAfter = await wtsqs.size()
      expect(sizeAfter).to.equal(sizeBefore)
    })

    it('should return array of length max `maxNumberOfMessages`', async function () {
      const payloads = [{}, {}, {}]
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const messages = await wtsqs.peekMany(2)
      expect(messages).to.have.lengthOf.at.most(2)
    })

    it('should allow peeking more than 10 messages', async function () {
      const payloads = new Array(20).fill({})
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const messages = await wtsqs.peekMany(15)
      expect(messages).to.have.lengthOf(15)
    })
  })

  describe('#deleteOne()', () => {
    it('should decrease queue size by one', async function () {
      await wtsqs.enqueueOne({})
      const message = await wtsqs.peekOne()
      await sleep(1000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.deleteOne(message)
      await sleep(2000)
      const sizeAfter = await wtsqs.size()

      expect(sizeAfter).to.equal(sizeBefore - 1)
    })
  })

  describe('#deleteMany()', () => {
    it('should decrease queue size by number of messages', async function () {
      await wtsqs.enqueueMany([{}, {}, {}])
      const messages = await wtsqs.peekMany(3)
      await sleep(3000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.deleteMany(messages)
      await sleep(3000)
      const sizeAfter = await wtsqs.size()

      expect(sizeAfter).to.equal(sizeBefore - messages.length)
    })

    it('should allow deleting more than 10 messages', async function () {
      const payloads = new Array(20).fill({})
      await wtsqs.enqueueMany(payloads)
      await sleep(1000)
      const messages = await wtsqs.peekMany(16)
      expect(messages).to.have.lengthOf.at.least(11)
      await sleep(3000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.deleteMany(messages)
      await sleep(3000)
      const sizeAfter = await wtsqs.size()

      expect(sizeAfter).to.equal(sizeBefore - messages.length)
    })
  })

  describe('#popOne()', () => {
    it('should return valid Message object', async function () {
      await wtsqs.enqueueOne({})
      const message = await wtsqs.popOne()
      expect(message).to.be.an('object')
        .that.has.all.keys('id', 'receiptHandle', 'md5', 'body')
    })

    it('should decrease queue size by one', async function () {
      await wtsqs.enqueueOne({})
      await sleep(2000)
      const sizeBefore = await wtsqs.size()
      await wtsqs.popOne()
      await sleep(2000)
      const sizeAfter = await wtsqs.size()

      expect(sizeAfter).to.equal(sizeBefore - 1)
    })
  })

  describe('#popMany()', () => {
    it('should return valid Message object', async function () {
      await wtsqs.enqueueMany([{}, {}, {}])
      const messages = await wtsqs.popMany(3)
      for (const message of messages) {
        expect(message).to.be.an('object')
          .that.has.all.keys('id', 'receiptHandle', 'md5', 'body')
      }
    })

    it('should decrease queue size by message count', async function () {
      await wtsqs.enqueueMany([{}, {}, {}])
      await sleep(2000)
      const sizeBefore = await wtsqs.size()
      const messages = await wtsqs.popMany(3)
      await sleep(2000)
      const sizeAfter = await wtsqs.size()

      expect(sizeAfter).to.equal(sizeBefore - messages.length)
    })
  })
})
