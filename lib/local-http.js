const fs = require('fs')
const express = require('express')
const app = express()

exports.addLocalPath = function addLocalPath(path) {
  // FIXME: better error handling, until then: throw
  fs.accessSync(path, fs.F_R_OK)
  app.use(express.static(path))
}

exports.start = function start(p, addr) {
  app.listen(p, addr)
}
