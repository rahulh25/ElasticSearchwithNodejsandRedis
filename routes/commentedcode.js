//GET METHOD
// router.get('/:id', function (req, res, next) {
//   var query = {
//     index: 'plan',
//     body: {
//       query: {
//         match: { 'objectId.keyword': req.params.id }
//       }
//     }
//   }
//   client.search(query, (err, result) => {
//     if (err) {
//       res.status(500)
//       res.send({ error: 'Some internal server error' })
//     }

//     //No Result
//     if (result.hits.total['value'] === 0) {
//       res.status(404)
//       res.send({ message: 'Data not found' })
//     } else {
//       var jsonData = ''
//       var membercostshareJson = ''
//       var arrofplanServiceID = []
//       var query = {
//         index: 'plan',
//         body: {
//           query: {
//             match: { 'objectId.keyword': req.params.id }
//           }
//         }
//       }
//       var result = search.search(query)
//       result.then(result => {
//         jsonData = {
//           _org: result.hits.hits[0]._source['_org'],
//           objectId: result.hits.hits[0]._source['objectId'],
//           objectType: result.hits.hits[0]._source['objectType'],
//           planType: result.hits.hits[0]._source['planType'],
//           creationDate: result.hits.hits[0]._source['creationDate']
//         }
//         var id = result.hits.hits[0]._source['objectId']
//         var membercostshareQuery = {
//           index: 'plan',
//           body: {
//             query: {
//               parent_id: {
//                 type: 'membercostshare',
//                 id: id
//               }
//             }
//           }
//         }

//         var membercostshareresult = search.search(membercostshareQuery)
//         membercostshareresult.then(r => {
//           membercostshareJson = {
//             deductible: r.hits.hits[0]._source['deductible'],
//             _org: r.hits.hits[0]._source['_org'],
//             copay: r.hits.hits[0]._source['copay'],
//             objectId: r.hits.hits[0]._source['objectId'],
//             objectType: r.hits.hits[0]._source['objectType']
//           }
//           jsonData['planCostShares'] = membercostshareJson
//           var planservicequery = {
//             index: 'plan',
//             body: {
//               query: {
//                 parent_id: {
//                   type: 'planservice',
//                   id: id
//                 }
//               }
//             }
//           }
//           let PlanServiceQuery = search.search(planservicequery)
//           PlanServiceQuery.then(result => {
//             for (key in result.hits.hits) {
//               arrofplanServiceID.push({
//                 objectId: result.hits.hits[key]._source['objectId'],
//                 _org: result.hits.hits[key]._source['_org'],
//                 objectType: result.hits.hits[key]._source['objectType']
//               })
//             }
//             let finalService = search.searchforinnerdata(arrofplanServiceID)
//             finalService.then(result => {
//               console.log(result)
//               jsonData['linkedPlanServices'] = result
//               res.status(200)
//               res.send(jsonData)
//             })
//           })
//         })
//       })
//     }
//   })
// })

//console.log(result)
// resultJson = JSON.parse(result)
// finalarr = []
// finalarr.push(resultJson['objectId'])
// finalarr.push(resultJson['planCostShares']['objectId'])
// for (key in resultJson['linkedPlanServices']) {
//   finalarr.push(
//     resultJson['linkedPlanServices'][key].linkedService['objectId']
//   )
//   finalarr.push(
//     resultJson['linkedPlanServices'][key].planserviceCostShares[
//       'objectId'
//     ]
//   )
// }
// client.delete(
//   {
//     index: 'plan',
//     routing: finalarr,
//     body: {
//       query: {
//         has_parent: {
//           parent_type: 'plan',
//           query: {
//             bool: {
//               must: [
//                 {
//                   match: {
//                     'objectId.keyword': req.params.id
//                   }
//                 }
//               ]
//             }
//           }
//         }
//       }
//     }
//   },
//   (err, result) => {
//     if (err) {
//       console.log(err)
//     } else {
//       client.deleteByQuery(
//         {
//           index: 'plan',
//           id: req.params.id
//         },
//         (err, result) => {
//           if (err) {
//             console.log(err)
//           } else {
//           }
//         }
//       )
//     }
//   }
// )
