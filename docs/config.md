# Configuration

_This is just an example of the ts-starter docs._

The Reverse Proxy can be configured using a `reverse-proxy.config.ts` _(or `reverse-proxy.config.js`)_ file and it will be automatically loaded when running the `reverse-proxy` command.

```ts
// reverse-proxy.config.{ts,js}
import type { ReverseProxyOptions } from '@stacksjs/rpx'
import os from 'node:os'
import path from 'node:path'

const config: ReverseProxyOptions = {
  /**
   * The from URL to proxy from.
   * Default: localhost:5173
   */
  from: 'localhost:5173',

  /**
   * The to URL to proxy to.
   * Default: stacks.localhost
   */
  to: 'stacks.localhost',

  /**
   * The HTTPS settings.
   * Default: true
   * If set to false, the proxy will use HTTP.
   * If set to true, the proxy will use HTTPS.
   * If set to an object, the proxy will use HTTPS with the provided settings.
   */
  https: {
    domain: 'stacks.localhost',
    hostCertCN: 'stacks.localhost',
    caCertPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.ca.crt`),
    certPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.crt`),
    keyPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.crt.key`),
    altNameIPs: ['127.0.0.1'],
    altNameURIs: ['localhost'],
    organizationName: 'stacksjs.org',
    countryName: 'US',
    stateName: 'California',
    localityName: 'Playa Vista',
    commonName: 'stacks.localhost',
    validityDays: 180,
    verbose: false,
  },

  /**
   * The verbose setting.
   * Default: false
   * If set to true, the proxy will log more information.
   */
  verbose: false,
}

export default config
```

_Then run:_

```bash
./rpx start
```

To learn more, head over to the [documentation](https://reverse-proxy.sh/).
