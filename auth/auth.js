const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.ISSUER,
  clientId: process.env.CLIENT_ID
})

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    if (!authorization) {
      res.status(401)
      res.send({ message: 'User not authenticated' })
    }
    const [authType, token] = authorization.trim().split(' ')
    if (authType !== 'Bearer') {
      res.status(401)
      res.send({ message: 'User not authenticated' })
    }
    const { claims } = await oktaJwtVerifier.verifyAccessToken(token)
    if (!claims.scp.includes(process.env.SCOPE)) {
      res.status(403)
      res.send({ message: 'User not authorized' })
    }
    next()
  } catch (error) {
    res.status(401)
    res.send({ message: 'Token expired. Login again' })
  }
}
