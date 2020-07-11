var express = require('express')
var router = express.Router()
var jsonschemavalidation = require('../schemavalidation/jsonschemavalidation')
var Redis = require('ioredis')
var redis = new Redis()

var jsonmergepatch = require('json-merge-patch')
router.post('/', function (req, res, next) {
  try {
    const result = jsonschemavalidation(req.body)
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
  } catch (Exception) {
    res.status(500)
    res.send({ error: 'Some internal server error' })
  }
})
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
        res.send({ data: JSON.parse(result) })
      }
    }
  })
})
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
        var jsondatatovalidate = req.body
        jsondatatovalidate['objectId'] = req.params.id
        const result = jsonschemavalidation(jsondatatovalidate)
        if (result === true) {
          redis.set(req.params.id, JSON.stringify(jsondatatovalidate))
          res.status(200)
          res.send({
            message:
              'Data updated successfully successfully for id: ' + req.params.id
          })
        } else {
          res.status(400)
          res.send({ error: 'Data is not in correct format' })
        }
      }
    }
  })
})
router.patch('/:id', function (req, res, next) {
  redis.get(req.params.id, (err, result) => {
    if (err) {
      res.status(500)
      res.send({ error: 'Some internal server error' })
    } else {
      if (result === null) {
        res.status(404)
        res.send({ message: 'Data not found' })
      } else {
        try {
          var jsonData = req.body
          var jsonToMatch = JSON.parse(result)
          var patch = jsonmergepatch.generate(jsonToMatch, jsonData)
          for (key in patch) {
            if (patch[key] === null) {
              patch[key] = jsonToMatch[key]
            }
          }
          const jsonResult = jsonschemavalidation(patch)
          if (jsonResult === true) {
            redis.set(req.params.id, JSON.stringify(patch))
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
        } catch (error) {
          console.log(error)
          res.status(500)
          res.send({ error: 'Some internal server error' })
        }
      }
    }
  })
})

module.exports = router
