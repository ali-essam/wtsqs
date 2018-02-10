// setup chai
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const utils = require('../lib/utils')

describe('_utils', () => {
  describe('#flatten()', () => {
    it('should flatten arrays', async function () {
      const arrs = [[1, 2], [3], [4, 5]]
      const flatArr = utils.flatten(arrs)
      expect(flatArr).to.eql([1, 2, 3, 4, 5])
    })
  })

  describe('#chunk()', () => {
    it('should allow chunking empty array', async function () {
      expect(utils.chunk([])).to.eql([])
    })

    it('should chunk array to size', async function () {
      const arr = [1, 2, 3, 4, 5]
      const chunks = utils.chunk(arr, 2)
      expect(chunks).to.deep.eql([[1, 2], [3, 4], [5]])
    })
  })

  describe('#chunkNumber()', () => {
    it('should chunk number to exact slices', async function () {
      const chunks = utils.chunkNumber(6, 2)
      expect(chunks).to.eql([2, 2, 2])
    })

    it('should chunk number with extra slices', async function () {
      const chunks = utils.chunkNumber(7, 2)
      expect(chunks).to.eql([2, 2, 2, 1])
    })
  })
})
