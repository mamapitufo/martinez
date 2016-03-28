#!/usr/bin/env node

const fs = require('fs')
const url = require('url')

const _ = require('lodash')
const express = require('express')
const httpProxy = require('http-proxy')
const tunnel = require('tunnel')
const argv = require('yargs')
  .usage('Usage: $0 --local local_dir1 [--local local_dir2]')

  .demand('l')
  .alias('l', 'local')
  .nargs('l', 1)
  .describe('l', `Local directory. You can provide more than one, files
            will be looked up in the order they were added`)

  .number('p')
  .alias('p', 'port')
  .default('p', 8080)
  .describe('p', 'Listen on this port')

  .string('a')
  .alias('a', 'address')
  .default('a', '0.0.0.0')
  .describe('a', 'Listen on this address')

  .string('r')
  .alias('r', 'remote')
  .describe('r', 'Remote url to forward all non-local resources')

  .string('proxy')
  .describe('proxy', 'Proxy to connect to remote resources')

  .boolean('allow-invalid-cert')
  .describe('allow-invalid-cert', 'Accept invalid or self-signed SSL certs')

  .help('h')
  .alias('h', 'help')
  .argv

const app = express()
const localPaths = _.isArray(argv.local) ? argv.local : [ argv.local ]
localPaths.forEach(addLocal)

if (argv.allowInvalidCert) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
if (argv.remote) app.use(forwardTo(argv.remote))

console.log(`Listening on ${argv.address}:${argv.port}`)
app.listen(argv.port, argv.address)

function addLocal(path) {
  // FIXME: better error handling, until then: throw
  fs.accessSync(path, fs.F_R_OK)
  app.use(express.static(path))
}

function forwardTo(target) {
  const proxy = createProxy(target)
  return (req, res) => {
    proxy.web(req, res)
  }
}

function createProxy(target) {
  const config = {
    target: target,
    changeOrigin: true,
    secure: false // usually the local name won't compatible with remote cert
  }
  if (argv.proxy) {
    config.agent = getProxyedAgent(argv.proxy, target)
    config.toProxy = true
  }

  return httpProxy.createProxyServer(config)
}

function getProxyedAgent(proxy, target) {
  const urlParts = url.parse(proxy)
  const config = {
    proxy: {
      host: urlParts.hostname,
      port: urlParts.port
    }
  }
  const isHttps = url.parse(target).protocol === 'https:'

  return isHttps ?  tunnel.httpsOverHttp(config) : tunnel.httpOverHttp(config)
}

