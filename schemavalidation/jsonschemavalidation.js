const Validator = require('jsonschema').Validator
const JsonSchemaValidation = jsondata => {
  const v = new Validator()

  const membercostshare = {
    id: '/MemberCostShare',
    type: 'object',
    properties: {
      _org: { type: 'string' },
      copay: { type: 'integer', minimum: 0 },
      deductible: { type: 'integer', minimum: 0 },
      objectId: { type: 'string' }
    },
    required: ['copay', 'deductible','objectId','_org'],
    additionalProperties: false
  }
  const linkedService = {
    id: './LinkedService',
    type: 'object',
    properties: {
      _org: { type: 'string' },
      objectId: { type: 'string' },
      name: { type: 'string' }
    },
    required: ['name','objectId','_org'],
    additionalProperties: false
  }
  var plan = {
    id: '/Plan',
    type: 'object',
    properties: {
      _org: { type: 'string' },
      objectId: { type: 'string' },
      planType: { type: 'string' },
      creationDate: {
        type: 'string',
        format: 'date'
      },
      planCostShares: { $ref: '/MemberCostShare' },
      linkedPlanServices: {
        type: 'array',
        items: {
          properties: {
            linkedService: { $ref: '/LinkedService' },
            planserviceCostShares: { $ref: '/MemberCostShare' },
            _org: { type: 'string' },
            objectId: { type: 'string' }
          },
          required:['_org','linkedService','planserviceCostShares','objectId']
        }
      }
    },
    required: ['planType','objectId','_org','creationDate','planCostShares','linkedPlanServices'],
    additionalProperties: false
  }
  v.addSchema(membercostshare, '/MemberCostShare')
  v.addSchema(linkedService, '/LinkedService')
  var results = v.validate(jsondata, plan)
  console.log(results)
  if (results.errors.length === 0) {
    return true
  }
  return false
}
module.exports = JsonSchemaValidation
