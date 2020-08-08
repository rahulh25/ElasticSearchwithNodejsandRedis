var kafka = require('kafka-node')

var addtoqueue = val => {
  var Producer = kafka.Producer
  const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' })
  var producer = new Producer(client)
  var payloads = [{ topic: 'rahulfinal', messages: val }]
  producer.on('ready', function () {
    producer.send(payloads, function (err, data) {
      console.log(data)
    })
  })

  producer.on('error', function (err) {
    console.log(err)
  })
}

module.exports = { addtoqueue }
