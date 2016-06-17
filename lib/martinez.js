#!/usr/bin/env node

const fs = require('fs')
const url = require('url')
const path = require('path')

const _ = require('lodash')
const express = require('express')
const httpProxy = require('http-proxy')
const tunnel = require('tunnel')
const options = require('yargs')
  .usage(`Usage: $0 --local local_dir1 [--local local_dir2] [--remote https://example.com]
  [--config martinez.config.js]`)

  .demand('l')
  .alias('l', 'local')
  .describe('l', 'Local directory. You can provide more than one, files will be looked up in the order they were added')

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

  .string('x')
  .alias('x', 'proxy')
  .describe('proxy', 'Proxy to connect to remote resources')

  .string('config')
  .describe('config', 'Load configuration from the given file')

  .boolean('allow-invalid-cert')
  .describe('allow-invalid-cert', 'Accept invalid or self-signed SSL certs')
  .default('allow-invalid-cert', false)

  .boolean('strip-cookie-domain')
  .describe('strip-cookie-domain', 'Remove `Domain` from cookies set from proxied remotes')
  .default('strip-cookie-domain', true)

  .requiresArg(['l', 'p', 'a', 'r', 'x', 'config'])
  .version()

  .help('h')
  .alias('h', 'help')
  .argv

const app = express()
const config = getConfig(options.config)

const localPaths = _.isArray(options.local) ? options.local : [ options.local ]
localPaths.forEach(addLocal)

if (options.allowInvalidCert)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

if (config.rewrite)
  app.use(addRewrite(config.rewrite))

if (options.remote)
  app.use(forwardTo(options.remote))

console.log(`Listening on ${options.address}:${options.port}`)
app.listen(options.port, options.address)

function getConfig(filePath) {
  try {
    fs.accessSync(filePath, fs.F_OK | fs.R_OK)
    return require(path.resolve(filePath))
  } catch (err) {
    // TODO: maybe filter the error message a bit...
    console.error(`error reading config file '${filePath}':`, err, '\nIgnoring config file!')
    return {}
  }
}

function addLocal(filePath) {
  // FIXME: better error handling, until then: throw
  fs.accessSync(filePath, fs.F_OK | fs.R_OK | fs.X_OK)
  app.use(express.static(filePath))
}

function addRewrite(rules) {
  return function rewrite(req, res, next) {
    if (rules[req.path]) {
      const processor = rules[req.path]
      const resWrite = res.write
      res.write = function (data) {
        const body = data.toString('utf8')
        resWrite.call(res, processor(body))
      }
    }
    next()
  }
}

function forwardTo(target) {
  const proxy = createProxy(target)
  if (options.stripCookieDomain)
    stripCookieDomain(proxy)

  return (req, res) => {
    // FIXME: deal with zipped content in a better way?
    if (config.rewrite) delete req.headers['accept-encoding']
    proxy.web(req, res)
  }
}

function stripCookieDomain(proxy) {
  proxy.on('proxyRes', proxyRes => {
    const setCookie = proxyRes.headers['set-cookie']
    if (setCookie)
      proxyRes.headers['set-cookie'] = setCookie.map(cookie => cookie.replace(/Domain=[^;]+;?/, ''))
  })
}

function createProxy(target) {
  const proxyOptions = {
    target: target,
    changeOrigin: true,
    autoRewrite: true,
    secure: false // usually the local name won't compatible with remote cert
  }
  if (options.proxy) {
    proxyOptions.agent = sslAgentWithProxy(options.proxy, target)
    proxyOptions.toProxy = true
  }

  const proxy = httpProxy.createProxyServer(proxyOptions)

  proxy.on('error', err => {
    // TODO: better error reporting
    console.warn('error on proxied request:', err)
  })

  return proxy
}

function sslAgentWithProxy(proxy, target) {
  const urlParts = url.parse(proxy)
  const agentOptions = {
    proxy: {
      host: urlParts.hostname,
      port: urlParts.port
    }
  }
  const isHttps = url.parse(target).protocol === 'https:'

  return isHttps ? tunnel.httpsOverHttp(agentOptions) : tunnel.httpOverHttp(agentOptions)
}

