require('dotenv').config()
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
const cors = require('cors')
var indexRouter = require('./routes/index')
var planRouter = require('./routes/plans')
const bodyParser = require('body-parser')
const authMiddleware = require('./auth/auth')
var app = express()

app.set('etag', 'weak')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(authMiddleware)
app.use('/', indexRouter)
app.use('/plans', planRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404)
  res.send({ message: 'URL NOT FOUND' })
})

app.listen(3000, () => {
  console.log('App listening on port 3000!')
})
