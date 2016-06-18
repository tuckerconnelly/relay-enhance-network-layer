/**
 * Formats an error response from GraphQL server request.
 */
function formatRequestErrors(request, errors) {
  const CONTEXT_BEFORE = 20
  const CONTEXT_LENGTH = 60

  const queryLines = request.getQueryString().split('\n')
  return errors.map(({ locations, message }, i) => {
    const prefix = (i + 1) + '. '
    const indent = ' '.repeat(prefix.length)

    // Custom errors thrown in graphql-server may not have locations
    const locationMessage = locations ?
      ('\n' + locations.map(({ column, line }) => {
        const queryLine = queryLines[line - 1]
        const offset = Math.min(column - 1, CONTEXT_BEFORE)
        return [
          queryLine.substr(column - 1 - offset, CONTEXT_LENGTH),
          ' '.repeat(offset) + '^^^',
        ].map(messageLine => indent + messageLine).join('\n')
      }).join('\n')) :
      ''

    return prefix + message + locationMessage
  }).join('\n')
}

export default networkLayer => ({
  sendMutation: request => networkLayer.sendMutation(request)
    .then(result => {
      if (result.hasOwnProperty('errors')) {
        const error = new Error(
          'Server request for mutation `' + request.getDebugName() + '` ' +
          'failed for the following reasons:\n\n' +
          formatRequestErrors(request, result.errors)
        )
        error.source = result
        request.reject(error)
        return
      }

      request.resolve({ response: result.data })
    })
    .catch(error => request.reject(error)),

  sendQueries: requests => networkLayer.sendQueries(requests)
    .then(results => {
      results.forEach((result, i) => {
        if (result.hasOwnProperty('errors')) {
          const error = new Error(
            'Server request for query `' + requests[i].getDebugName() + '` ' +
            'failed for the following reasons:\n\n' +
            formatRequestErrors(requests[i], result.errors)
          )
          error.source = result
          requests[i].reject(error)
          return
        }

        if (!result.hasOwnProperty('data')) {
          requests[i].reject(new Error(
            'Server response was missing for query `' + requests[i].getDebugName() +
            '`.'
          ))
        }

        requests[i].resolve({ response: result.data })
      })
    }),
  supports: networkLayer.supports,
})
