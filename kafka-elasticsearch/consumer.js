var esclient = require('../elasticsearch/connection')
var kafka = require('kafka-node')

const consumetopic = () => {
  try {
    Consumer = kafka.Consumer
    const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' })
    client.remove
    consumer = new Consumer(client, [{ topic: 'rahulfinal', partition: 0 }], {
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

// const removeTopic = () => {
//   Consumer = kafka.Consumer
//   const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' })
//   consumer = new Consumer(client, [{ topic: 'finalfinal', partition: 0 }], {
//     autoCommit: true
//   })
//   consumer.removeTopics(['finalfinal'], function (err, removed) {
//     console.log('I am here')
//     console.log(removed)
//   })
// }

module.exports = { consumetopic }
