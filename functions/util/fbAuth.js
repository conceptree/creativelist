/* eslint-disable consistent-return */
const {admin, db} = require('./admin');

module.exports = (req, res, next) => {
	let idToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		idToken = req.headers.authorization.split('Bearer ');
	} else {
		console.log('No token found!');
		return res.status(403).json({ error: 'Unauthorized' });
	}

	admin.auth()
		.verifyIdToken(idToken)
		.then((decodedToken) => {
			req.user = decodedToken;
			return db.collection('users').where('userId', '==', req.user.uid).limit(1).get();
		}).then(data=>{
			req.user.userName = data.docs[0].data().userName;
			return next();
		})
		.catch((error) => {
			console.log('Error validating token!', error);
			return req.status(403).json(error);			
		});
};