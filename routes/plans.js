var express = require('express')
var router = express.Router()
var jsonschemavalidation = require('../schemavalidation/jsonschemavalidation')
var jsonmergepatch = require('json-merge-patch')
var indexing = require('../elasticsearch/createIndexes')
var addtoqueue = require('../kafka-elasticsearch/service')
var consumer = require('../kafka-elasticsearch/consumer')
const client = require('../elasticsearch/connection')
const search = require('../elasticsearch/search')
var Redis = require('ioredis')
const { response } = require('express')
var redis = new Redis()

//POST Method
router.post('/', function (req, res, next) {
  try {
    //Validate the JSON data
    const result = jsonschemavalidation(req.body)

    //If Validation Successfull
    if (result === true) {
      redis.set(req.body['objectId'], JSON.stringify(req.body))
      //Create the Member Cost Share Data for ElasticSearch (planCostShares in the json data)
      const membercostshare = indexing.createMembercostShare(
        req.body['planCostShares'],
        req.body['objectId']
      )

      //The main plan body
      const planbody = {
        _org: req.body['_org'],
        objectId: req.body['objectId'],
        objectType: req.body['objectType'],
        planType: req.body['planType'],
        creationDate: req.body['creationDate'],
        plan_service: {
          name: 'plan'
        }
      }

      //Routing to be used for child data
      var routing = req.body['objectId']

      //Creating the payload for plan
      var planpayload = {
        id: req.body['objectId'],
        index: 'plan',
        body: planbody
      }

      //Creating the payload for member cost share
      var membercostsharepayload = {
        id: req.body['planCostShares']['objectId'],
        index: 'plan',
        body: membercostshare,
        routing: routing
      }

      //Adding data to kafka queue
      addtoqueue.addtoqueue(JSON.stringify(planpayload))
      addtoqueue.addtoqueue(JSON.stringify(membercostsharepayload))

      //Adding child relation for linkedPlanServices
      for (key in req.body['linkedPlanServices']) {
        //Function to create body for linkedService,planserviceCostShares
        var planService = indexing.createPlanService(
          req.body['linkedPlanServices'][key],
          req.body['linkedPlanServices'][key]['objectId']
        )

        //Creating the body for PlanService(linkedPlanServices in json data)
        var body = {
          objectId: planService['objectId'],
          _org: planService['_org'],
          objectType: planService['objectType'],
          plan_service: {
            name: 'planservice',
            parent: req.body['objectId']
          }
        }

        //creating linkedPlanServices payload
        var planservicepayload = {
          id: planService['objectId'],
          index: 'plan',
          body: body,
          routing: routing
        }

        //creating the planserviceCostShares payload
        var planServiceCostSharepayload = {
          id: planService['planserviceCostShares']['objectId'],
          index: 'plan',
          body: planService['planserviceCostShares'],
          routing: planService['objectId']
        }

        //Creating the linkedService payload
        var linkedServicePayload = {
          id: planService['linkedService']['objectId'],
          index: 'plan',
          body: planService['linkedService'],
          routing: planService['objectId']
        }

        //Adding data to kafka queue
        addtoqueue.addtoqueue(JSON.stringify(planservicepayload))
        addtoqueue.addtoqueue(JSON.stringify(linkedServicePayload))
        addtoqueue.addtoqueue(JSON.stringify(planServiceCostSharepayload))
      }

      //Function to add data to elasticsearch from kafka queue
      consumer.consumetopic()

      //Send the response
      res.status(200)
      res.send({ msg: 'Data Added Successfully' })
    } else {
      //If data not in correct format
      res.status(400)
      res.send({ error: 'Data is not in correct format' })
    }
  } catch (Exception) {
    //Internal Server Error
    res.status(500)
    res.send({ error: 'Some internal server error' })
  }
})

//PUT METHOD
router.put('/:id', function (req, res, next) {
  redis.get(req.params.id, (err, result) => {
    if (err) {
      res.status(500)
      res.send({ error: 'Some internal server error' })
    } else {
      if (result === null) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        //Search for the id in elascticsearch
        client.search(
          {
            index: 'plan',
            body: {
              query: {
                match: { 'objectId.keyword': req.params.id }
              }
            }
          },
          (err, result) => {
            if (err) {
              res.status(500)
              res.send({ error: 'Some internal server error' })
            }

            //No result found
            if (result.hits.total['value'] === 0) {
              res.status(404)
              res.send({ message: 'Data not found' })
            } else {
              //Validate data
              var jsondatatovalidate = req.body
              jsondatatovalidate['objectId'] = req.params.id
              const result = jsonschemavalidation(jsondatatovalidate)
              if (result === true) {
                redis.set(req.params.id, JSON.stringify(jsondatatovalidate))
                //Same process as POST Method
                const membercostshare = indexing.createMembercostShare(
                  jsondatatovalidate['planCostShares'],
                  jsondatatovalidate['objectId']
                )
                const planbody = {
                  _org: jsondatatovalidate['_org'],
                  objectId: jsondatatovalidate['objectId'],
                  objectType: jsondatatovalidate['objectType'],
                  planType: jsondatatovalidate['planType'],
                  creationDate: jsondatatovalidate['creationDate'],
                  plan_service: {
                    name: 'plan'
                  }
                }
                var routing = jsondatatovalidate['objectId']
                var planpayload = {
                  id: jsondatatovalidate['objectId'],
                  index: 'plan',
                  body: planbody
                }
                var membercostsharepayload = {
                  id: jsondatatovalidate['planCostShares']['objectId'],
                  index: 'plan',
                  body: membercostshare,
                  routing: routing
                }
                addtoqueue.addtoqueue(JSON.stringify(planpayload))
                addtoqueue.addtoqueue(JSON.stringify(membercostsharepayload))
                for (key in jsondatatovalidate['linkedPlanServices']) {
                  var planService = indexing.createPlanService(
                    jsondatatovalidate['linkedPlanServices'][key],
                    jsondatatovalidate['linkedPlanServices'][key]['objectId']
                  )
                  var body = {
                    objectId: planService['objectId'],
                    _org: planService['_org'],
                    objectType: planService['objectType'],
                    plan_service: {
                      name: 'planservice',
                      parent: jsondatatovalidate['objectId']
                    }
                  }
                  var planservicepayload = {
                    id: planService['objectId'],
                    index: 'plan',
                    body: body,
                    routing: routing
                  }
                  var planServiceCostSharepayload = {
                    id: planService['planserviceCostShares']['objectId'],
                    index: 'plan',
                    body: planService['planserviceCostShares'],
                    routing: planService['objectId']
                  }
                  var linkedServicePayload = {
                    id: planService['linkedService']['objectId'],
                    index: 'plan',
                    body: planService['linkedService'],
                    routing: planService['objectId']
                  }
                  addtoqueue.addtoqueue(JSON.stringify(planservicepayload))
                  addtoqueue.addtoqueue(JSON.stringify(linkedServicePayload))
                  addtoqueue.addtoqueue(
                    JSON.stringify(planServiceCostSharepayload)
                  )
                }
                consumer.consumetopic()
                res.status(200)
                res.send({
                  message:
                    'Data updated successfully successfully for id: ' +
                    req.params.id
                })
              } else {
                res.status(400)
                res.send({ error: 'Data is not in correct format' })
              }
            }
          }
        )
      }
    }
  })
})

//PATCH METHOD
router.patch('/:id', function (req, res, next) {
  //Search for the data
  client.search(
    {
      index: 'plan',
      body: {
        query: {
          match: { 'objectId.keyword': req.params.id }
        }
      }
    },
    (err, result) => {
      if (err) {
        res.status(500)
        res.send({ error: 'Some internal server error' })
      }

      //No Result
      if (result.hits.total['value'] === 0) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        var jsonData = ''
        var membercostshareJson = ''
        var arrofplanServiceID = []
        var query = {
          index: 'plan',
          body: {
            query: {
              match: { 'objectId.keyword': req.params.id }
            }
          }
        }
        var result = search.search(query)
        result.then(result => {
          jsonData = {
            _org: result.hits.hits[0]._source['_org'],
            objectId: result.hits.hits[0]._source['objectId'],
            objectType: result.hits.hits[0]._source['objectType'],
            planType: result.hits.hits[0]._source['planType'],
            creationDate: result.hits.hits[0]._source['creationDate']
          }
          var id = result.hits.hits[0]._source['objectId']
          var membercostshareQuery = {
            index: 'plan',
            body: {
              query: {
                parent_id: {
                  type: 'membercostshare',
                  id: id
                }
              }
            }
          }

          var membercostshareresult = search.search(membercostshareQuery)
          membercostshareresult.then(r => {
            membercostshareJson = {
              deductible: r.hits.hits[0]._source['deductible'],
              _org: r.hits.hits[0]._source['_org'],
              copay: r.hits.hits[0]._source['copay'],
              objectId: r.hits.hits[0]._source['objectId'],
              objectType: r.hits.hits[0]._source['objectType']
            }
            jsonData['planCostShares'] = membercostshareJson
            var planservicequery = {
              index: 'plan',
              body: {
                query: {
                  parent_id: {
                    type: 'planservice',
                    id: id
                  }
                }
              }
            }
            let PlanServiceQuery = search.search(planservicequery)
            PlanServiceQuery.then(result => {
              for (key in result.hits.hits) {
                arrofplanServiceID.push({
                  objectId: result.hits.hits[key]._source['objectId'],
                  _org: result.hits.hits[key]._source['_org'],
                  objectType: result.hits.hits[key]._source['objectType']
                })
              }
              let finalService = search.searchforinnerdata(arrofplanServiceID)
              finalService.then(result => {
                console.log(result)
                jsonData['linkedPlanServices'] = result
                var mainjson = req.body
                //var jsonToMatch = JSON.parse(result)
                //Merge the incoming patch json data with the original data
                var patch = jsonmergepatch.generate(jsonData, mainjson)

                for (key in patch) {
                  if (patch[key] === null) {
                    patch[key] = jsonData[key]
                  }
                }
                const jsonResult = jsonschemavalidation(patch)
                if (jsonResult === true) {
                  redis.set(req.params.id, JSON.stringify(patch))
                  const membercostshare = indexing.createMembercostShare(
                    patch['planCostShares'],
                    patch['objectId']
                  )
                  const planbody = {
                    _org: patch['_org'],
                    objectId: patch['objectId'],
                    objectType: patch['objectType'],
                    planType: patch['planType'],
                    creationDate: patch['creationDate'],
                    plan_service: {
                      name: 'plan'
                    }
                  }
                  var routing = patch['objectId']
                  var planpayload = {
                    id: patch['objectId'],
                    index: 'plan',
                    body: planbody
                  }
                  var membercostsharepayload = {
                    id: patch['planCostShares']['objectId'],
                    index: 'plan',
                    body: membercostshare,
                    routing: routing
                  }
                  addtoqueue.addtoqueue(JSON.stringify(planpayload))
                  addtoqueue.addtoqueue(JSON.stringify(membercostsharepayload))
                  for (key in patch['linkedPlanServices']) {
                    var planService = indexing.createPlanService(
                      patch['linkedPlanServices'][key],
                      patch['linkedPlanServices'][key]['objectId']
                    )
                    var body = {
                      objectId: planService['objectId'],
                      _org: planService['_org'],
                      objectType: planService['objectType'],
                      plan_service: {
                        name: 'planservice',
                        parent: patch['objectId']
                      }
                    }
                    var planservicepayload = {
                      id: planService['objectId'],
                      index: 'plan',
                      body: body,
                      routing: routing
                    }
                    var planServiceCostSharepayload = {
                      id: planService['planserviceCostShares']['objectId'],
                      index: 'plan',
                      body: planService['planserviceCostShares'],
                      routing: planService['objectId']
                    }
                    var linkedServicePayload = {
                      id: planService['linkedService']['objectId'],
                      index: 'plan',
                      body: planService['linkedService'],
                      routing: planService['objectId']
                    }
                    addtoqueue.addtoqueue(JSON.stringify(planservicepayload))
                    addtoqueue.addtoqueue(JSON.stringify(linkedServicePayload))
                    addtoqueue.addtoqueue(
                      JSON.stringify(planServiceCostSharepayload)
                    )
                  }
                  consumer.consumetopic()
                  res.status(200)
                  res.send({
                    message:
                      'Data updated successfully successfully for id: ' +
                      req.params.id
                  })
                } else {
                  res.status(400)
                  res.send({ error: 'Data is not in correct format' })
                }
              })
            })
          })
        })
      }
    }
  )
})

//DELETE METHOD
router.delete('/:id', function (req, res, next) {
  redis.get(req.params.id, (err, result) => {
    if (err) {
      res.status(500)
      res.send({ error: 'Some internal server error' })
    } else {
      if (result === null) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        client.indices.delete(
          {
            index: 'plan'
          },
          (err, result) => {
            if (err) {
              res.status(500)
              res.send({ message: 'Internal Server error' })
            } else {
              redis.del(req.params.id, (err, result) => {
                if (err) {
                  res.status(500)
                  res.send({ error: 'Internal Server error' })
                } else {
                  res.status(200)
                  res.send({ msg: 'Deleted Successfully' })
                }
              })
            }
          }
        )
      }
    }
  })
})

//GET METHOD
router.get('/:id', function (req, res, next) {
  redis.get(req.params.id, (err, result) => {
    if (err) {
      res.status(500)
      res.send({ error: 'Some internal server error' })
    } else {
      if (result === null) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        res.status(200)
        res.send(JSON.parse(result))
      }
    }
  })
})

module.exports = router
