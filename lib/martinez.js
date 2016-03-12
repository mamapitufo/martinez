const express = require('express')
const app = express()

const port = 8080

app.all('/*', (req, res) => {
  console.log('request:', req.url)
  res.send(`you requested: ${req.url}`)
})

app.listen(port)

