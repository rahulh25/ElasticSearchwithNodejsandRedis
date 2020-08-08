const client = require('../elasticsearch/connection')

function search (query) {
  return client
    .search(query)
    .then(res => {
      return res
    })
    .catch(err => {
      return err
    })
}

function searchforinnerdata (arr) {
  return client
    .search({
      index: 'plan',
      body: {
        query: {
          has_parent: {
            parent_type: 'planservice',
            query: {
              match_all: {}
            }
          }
        }
      }
    })
    .then(result => {
      for (key in arr) {
        for (i in result.hits.hits) {
          if (arr[key]['objectId'] === result.hits.hits[i]._routing) {
            if (
              result.hits.hits[i]._source['plan_service'].name === 'service'
            ) {
              delete result.hits.hits[i]._source['plan_service']
              arr[key]['linkedService'] = result.hits.hits[i]._source
            } else if (
              result.hits.hits[i]._source['plan_service'].name ===
              'planservice_membercostshare'
            ) {
              delete result.hits.hits[i]._source['plan_service']
              arr[key]['planserviceCostShares'] = result.hits.hits[i]._source
            }
          }
        }
      }
      return arr
    })
    .catch(error => {
      return error
    })
}
module.exports = { search, searchforinnerdata }
