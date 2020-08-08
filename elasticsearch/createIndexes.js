//planCostShares
const createMembercostShare = (data, id) => {
  var membercostsharerelation = {
    name: 'membercostshare',
    parent: id
  }
  return {
    deductible: data['deductible'],
    _org: data['_org'],
    copay: data['copay'],
    objectId: data['objectId'],
    objectType: data['objectType'],
    plan_service: membercostsharerelation
  }
}

const createPlanService = (data, id) => {
  var servicerelation = {
    name: 'service',
    parent: id
  }
  var planservice_membercostsharerelation = {
    name: 'planservice_membercostshare',
    parent: id
  }
  data['linkedService']['plan_service'] = servicerelation
  data['planserviceCostShares'][
    'plan_service'
  ] = planservice_membercostsharerelation
  return data
}

module.exports = { createMembercostShare, createPlanService }
