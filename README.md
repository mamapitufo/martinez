# martinez

Mix local and remote resources. Simple http server that allows to combine local directories with a remote resource.

You can specify any number of local directories, the server will try to match each request to a local resource, in the
order they were added, or forward to the remote address, if specified.

# Installation

```sh
$ npm install --global martinez
```

# Options

* `-l`, `--local target/`, config `local`: Local directory. You can provide more than one and requests will be looked up
  in the order they were added. This is required. For configuring multiple entries in the configuration object, use an array.
* `-a`, `--address 10.101.1.101`, config `address`: Local address in which to listen for requests. Defaults to `'0.0.0.0'`.
* `-p`, `--port 80`, config `port`: Local port in which to listen for requests. Defaults to `8080`.
* `-r`, `--remote https://example.com/`, config `remote`: Remote URL to forward all non-local resources (http or https).
* `--strip-cookie-domain`, config `stripCookieDomain`: On forwarded requests, strip the `Domain` from any cookies set. This
  will allow the cookie to be set for any subsequent requests. Defaults to `true`.
* `-x`, `--proxy http://localhost:3128`, config `proxy`: Proxy to use to connect to the remote resource.
* `--allow-invalid-cert`, config `allowInvalidCert`: Allows self-signed SSL certificates. Defaults to `false`.
* `--config config.js`: Load a configuration from the given file. All options can be configured in a file. Any options specified
  in the command line will override options in the configuration file.
* `--help`: Shows the help screen and exits.
* `--version`: Shows the current version number and exits.

# Examples

## Basic local dev server

Serve resources from `dist/`:

```sh
$ martinez --local dist
```

## Basic local + remote dev server

Serve resources from `dist/`, forward everything else to `https://mydevserver.example.com/`:

```sh
$ martinez --local dist --remote https://mydevserver.example.com
```

## Proxied remote dev server

Serve resources from `build/`, forward everything else to `http://dev.example.com` and use a debugging proxy such as
Charles to inspect the remote requests (Charles uses self-signed certs):

```sh
$ martinez --local build --remote http://dev.example.com/ --proxy http://localhost:8888/ --allow-invalid-cert
```

## Remote dev server with content rewriting

Serve resources from `target/`, forward everything else to `http://dev.example.com` and use the configuration entries in
`martinez.config.js` to rewrite certain response bodies:

```sh
$ martinez --local target/ --remote http://dev.example.com/ --config martinez.config.js
```

# Usage

## Content rewriting

Content rewriting is controlled via entries in the `rewrite` section in the configuration object. Each entry is keyed by
the path of the request and the value is a function that receives the body of the response as a String and returns the
new body that will be sent to the client.

This can be used to change entries in configuration files, replace remote paths with local paths in script tags, etc.

This example would rewrite the response from any request to `/api/v1/manifest` and change any instances of
'https://endpoint.example.com' to 'http://localhost/endpoint'.

```js
module.exports = {
  rewrite: {
    '/api/v1/manifest': function rewriteManifest(content) {
      return content.replace(/https:\/\/endpoint.example.com/gi, 'http://localhost/endpoint')
    }
  }
}
```

Currently the proxy only rewrites content for exact matches on the path.

