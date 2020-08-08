var esclient = require('../elasticsearch/connection')
var kafka = require('kafka-node')

const consumetopic = () => {
  try {
    Consumer = kafka.Consumer
    const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' })
    client.remove
    consumer = new Consumer(client, [{ topic: 'health', partition: 0 }], {
      autoCommit: true
    })
    consumer.on('message', async function (message) {
      esclient.index(JSON.parse(message.value))
      console.log('done')
    })

    consumer.on('error', function (err) {
      console.log('error', err)
    })
  } catch (e) {
    console.log(e)
  }
}

const removeTopic = () => {
  Consumer = kafka.Consumer
  const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' })
  consumer = new Consumer(client, [{ topic: 'finalplan', partition: 0 }], {
    autoCommit: false
  })
  consumer.removeTopics(['finalplan'], function (err, removed) {
    console.log('I am here')
    console.log(removed)
  })
}

module.exports = { removeTopic, consumetopic }
