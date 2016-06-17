# martinez

Mix local and remote resources. Simple http server that allows to combine local directories with a remote resource.

You can specify any number of local directories, the server will try to match each request to a local resource, in the
order they were added, or forward to the remote address, if specified.

# Installation

```sh
$ npm install --global martinez
```

# Options

* `-l`, `--local`: Local directory. You can provide more than one and requests will be looked up in the order they
  were added. This is required.
* `-a`, `--address`: Local address in which to listen for requests. Defaults to `'0.0.0.0'`.
* `-p`, `--port`: Local port in which to listen for requests. Defaults to `8080`.
* `-r`, `--remote`: Remote URL to forward all non-local resources (http or https).
* `--strip-cookie-domain`: On forwarded requests, strip the `Domain` from any cookies set. This will allow the cookie
  to be set for any subsequent requests. Defaults to `true`.
* `-x`, `--proxy`: Proxy to use to connect to the remote resource.
* `--allow-invalid-cert`: Allows self-signed SSL certificates. Defaults to `false`.
* `--help`: Shows the help screen and exits.
* `--version`: Shows the current version number and exits.

# Examples

Serve resources from `dist/`:

```sh
$ martinez --local dist
```

Serve resources from `dist/`, forward everything else to `https://mydevserver.example.com/`:

```sh
$ martinez --local dist --remote https://mydevserver.example.com
```

Serve resources from `build/`, forward everything else to `http://dev.example.com` and use a debugging proxy such as
Charles to inspect the remote requests (Charles uses self-signed certs):

```sh
$ martinez --local build --remote http://dev.example.com/ --proxy http://localhost:8888/ --allow-invalid-cert
```

