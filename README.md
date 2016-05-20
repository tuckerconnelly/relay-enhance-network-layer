relay-enhance-network-layer
==========

This wraps the `sendQueries` and `sendMutations` of a Relay NetworkLayer in higher-order functions to bring them up to snuff with `DefaultNetworkLayer`. It adds some sugar like pretty formatting of errors and automatically resolving/rejecting query requests if there are errors.

## Usage

```js
import enhanceNetworkLayer from 'relay-enhance-network-layer'

const myNetworkLayer = enhanceNetworkLayer({
  sendMutation: request => myMutationSender.fetch(request.getQueryString()),
  sendQueries: requests =>
  myQueriesSender.fetch(requests.map(request => request.getQueryString())),
  supports: () => false,
})
```

## License
MIT
