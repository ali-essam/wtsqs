// setup chai
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const sleep = require('sleep-promise')

const { WTSQS, WTSQSWorker } = require('../')

const mockPayloads = [
  { rick: "What about the reality where Hitler cured cancer, Morty? The answer is: Don't think about it." },
  { morty: "Nobody exists on purpose. Nobody belongs anywhere. We're all going to die. Come watch TV." },
  { rick: 'Weddings are basically funerals with cake.' },
  { rick: 'Listen, Morty, I hate to break it to you, but what people call "love" is just a chemical reaction that compels animals to breed.' },
  { morty: "Well then get your s**t together, get it all together, and put it in a backpack, all your s**t, so it's together." },
  { butterRobot: 'What is my purpose?', rick: 'You pass butter.', butterRobot2: 'Oh my god.', rick2: 'Yeah, welcome to the club, pal.' },
  { rick: "There's pros and cons to [burps] every alternate timeline. Fun facts about this one: It's got giant, telepathic spiders, eleven 9/11s, and the best ice cream in the multiverse!" },
  { morty: "Nobody exists on purpose, nobody belongs anywhere, everybody's gonna die. Come watch TV." },
  { rick: "Ruben's seen some rough years, Morty. You don't agree to get a theme park built inside you if your life is going great." },
  { snuffles: 'Tell me, Summer, if a human was born with stumpy legs, would they breed it with another deformed human and put their children on display like the Dachshund?' },
  { rick: "They're just robots, Morty! It's OK to shoot them! They're robots!" }
]

describe('WTSQSWorker', () => {
  const wtsqs = new WTSQS({
    url: process.env.AWS_SQS_URL,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  describe('#constructor()', () => {
    it('should fail if no wtsqs', async function () {
      try {
        new WTSQSWorker({}) // eslint-disable-line no-new
      } catch (e) {
        expect(e.name).to.equal('InvalidArgument')
      }
    })
  })

  describe('#run()', () => {
    it('should fail if no handler', async function () {
      const worker = new WTSQSWorker({ wtsqs })
      try {
        worker.run()
      } catch (e) {
        expect(e.name).to.equal('InvalidArgument')
      }
    })

    it('should fail if double run', async function () {
      const worker = new WTSQSWorker({ wtsqs })
      worker.run(() => null)
      try {
        worker.run(() => null)
      } catch (e) {
        expect(e.name).to.equal('WTSQSWorkerError')
      } finally {
        await worker.shutdown()
      }
    })
  })

  describe('#shutdown()', () => {
    it('should fail if worker not running', async function () {
      const worker = new WTSQSWorker({ wtsqs })
      try {
        worker.shutdown()
      } catch (e) {
        expect(e.name).to.equal('WTSQSWorkerError')
      }
    })

    it('should fail if double shutdown', async function () {
      const worker = new WTSQSWorker({ wtsqs })
      worker.run(() => null)
      await worker.shutdown()
      try {
        await worker.shutdown()
      } catch (e) {
        expect(e.name).to.equal('WTSQSWorkerError')
      }
    })
  })

  describe('e2e', () => {
    const worker = new WTSQSWorker({ wtsqs })

    before(async function () {
      this.timeout(70000)

      try {
        await wtsqs.deleteAll()
      } catch (e) {
        await sleep(61000)
        await wtsqs.deleteAll()
      }

      await sleep(1000)
    })

    after(async function () {
      this.timeout(10000)

      await worker.shutdown()
    })

    it('should process all messages in queue', async function () {
      this.timeout(30000)
      this.retries(0)

      await wtsqs.enqueueMany(mockPayloads)

      const processedPayloads = []

      let _resolve
      let _reject

      const resPromise = new Promise((resolve, reject) => {
        _resolve = resolve
        _reject = reject
      })

      worker.run(async (job) => {
        // console.log(job)

        try {
          expect(mockPayloads).to.deep.include(job.body)
          expect(processedPayloads).to.not.deep.include(job.body)
        } catch (e) {
          return _reject(e)
        }

        processedPayloads.push(job.body)

        if (processedPayloads.length === mockPayloads.length) {
          return _resolve()
        }
      })

      return resPromise
    })
  })
})
