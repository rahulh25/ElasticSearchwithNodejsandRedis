var express = require('express')
var router = express.Router()
var jsonschemavalidation = require('../schemavalidation/jsonschemavalidation')
var Redis = require('ioredis')
var redis = new Redis()

router.post('/addplan', function (req, res, next) {
  try {
    const result=jsonschemavalidation(req.body)
    //console.log(result)
    console.log(req.body["creationDate"])
    if (result === true) {
      redis.set(req.body['objectId'], JSON.stringify(req.body))
      res.status(200)
      res.send({
        message: 'Data added successfully with id: ' + req.body['objectId']
      })
    } else {
      res.status(400)
      res.send({ error: 'Data is not in correct format' })
    }
  } catch(Exception) {
    console.log(Exception)
    res.status(500)
    res.send({ error: 'Some internal server error' })
  }
})
router.get('/getplan/:id', function (req, res, next) {
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
        res.send({ data: JSON.parse(result) })
      }
    }
  })
})
router.delete('/deleteplan/:id', function (req, res, next) {
  redis.get(req.params.id, (err, result) => {
    if (err) {
      res.status(500)
      res.send({ error: 'Some internal server error' })
    } else {
      if (result === null) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        redis.del(req.params.id, (err, result) => {
          if (err) {
            res.status(500)
            res.send({ error: 'Some internal server error' })
          } else {
            res.status(200)
            res.send({ message: 'Data Deleted Successfully' })
          }
        })
      }
    }
  })
})

module.exports = router
