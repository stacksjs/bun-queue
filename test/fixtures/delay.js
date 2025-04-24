'use strict'

module.exports = function delay(ms) {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms)
  })
}
