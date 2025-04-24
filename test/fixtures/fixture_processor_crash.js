/**
 * A processor file to be used in tests.
 *
 */
'use strict'

module.exports = function (job) {
  setTimeout(() => {
    if (typeof job.data.exitCode !== 'number') {
      throw new TypeError('boom!')
    }
    process.exit(job.data.exitCode)
  }, 100)

  return new Promise(() => {
    // do nothing
  })
}
