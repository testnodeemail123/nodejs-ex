//multiple middleware functions
var jwt    = require('jsonwebtoken');

module.exports = function(options) {

	switch(options) {

		case 'time':
				  return function(req, res, next) {
  					req.requestTime = Date.now()
				    next()
				  }
		break;
		case 'check_token':
				  return function(req, res, next) {
				    var token = req.body.token || req.query.token || req.headers['x-access-token'];
					  if (token) {
				      jwt.verify(token, app.get('superSecret'), function(err, decoded) {
				        if (err) {
				          return res.json({ type: 'Error', message: 'Failed to authenticate token.' });
				        } else {
				          // if everything is good, save to request for use in other routes
				          req.decoded = decoded;
				          next();
				        }
				      });
				    } else {
				      // if there is no token
				      // return an error
				      return res.status(403).send({
				          type: 'Error',
				          message: 'No token provided.'
				      });
				    }


				  }
		break;

	}		
}
