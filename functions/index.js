/* eslint-disable no-useless-escape */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const firebase = require('firebase');
const app = express();

const firebaseConfig = {
	apiKey: 'AIzaSyCPn_pOJD2gBYy23eq1AoFS9_fMcrJoY8I',
	authDomain: 'creativelist-2020.firebaseapp.com',
	databaseURL: 'https://creativelist-2020.firebaseio.com',
	projectId: 'creativelist-2020',
	storageBucket: 'creativelist-2020.appspot.com',
	messagingSenderId: '445689342566',
	appId: '1:445689342566:web:bc318a03ba36ee84a2dba7',
	measurementId: 'G-3DYCXBECP5'
};

admin.initializeApp();
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

const isEmpty = (string) => {
	return string.trim() === '' ? true : false;
};

const isEmail = (email) => {
	const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return email.match(regEx) ? true : false;
};

let errors = {};

const FBAuth = (req, res, next) => {
	let idToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		idToken = req.headers.authorization.split('Bearer ');
	} else {
		console.log('No token found!');
		return res.status(403).json({ error: 'Unauthorized' });
	}

	admin
		.auth()
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

app.get('/collection', (req, res) => {
	db
		.collection('collection')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let collection = [];
			data.forEach((doc) => {
				collection.push({
					id: doc.id,
					name: doc.data().name,
					description: doc.data().description,
					origin: doc.data().origin,
					type: doc.data().type,
					createdAt: doc.data().createdAt
				});
			});
			return res.json(collection);
		})
		.catch((error) => console.log(error));
});

app.post('/item', FBAuth, (req, res) => {
	const newItem = {
		name: req.body.name,
		description: req.body.description,
		url: req.body.url,
		type: req.body.type,
		origin: req.body.origin,
		createdBy: req.user.userName ? req.user.userName : null,
		createdAt: new Date().toISOString()
	};

	db
		.collection('collection')
		.add(newItem)
		.then((doc) => {
			return res.json({
				message: `document ${doc.id} created successfully`
			});
		})
		.catch((error) => {
			res.status(500).json({
				error: 'Something went wrong!'
			});
			console.log(error);
		});
});

app.post('/signup', (req, res) => {
	const newUser = {
		userName: req.body.userName,
		email: req.body.email,
		name: req.body.name,
		familyName: req.body.familyName,
		newsletter: req.body.newsletter,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	};

	if (validate(newUser)) {
		return res.status(400).json(errors);
	}

	let userToken, userId;

	db
		.doc(`/users/${newUser.userName}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res.status(400).json({ userName: 'This username is already taken! Please choose a new one.' });
			} else {
				return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((token) => {
			userToken = token;
			const userCredentials = {
				userName: newUser.userName,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId: userId
			};
			return db.doc(`/users/${newUser.userName}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token: userToken });
		})
		.catch((error) => {
			console.log(error);
			if (error.code === 'auth/email-already-in-use') {
				return res.status(400).json({ email: 'Email is already in use!' });
			} else {
				return res.status(500).json({ error: error.code });
			}
		});
});

app.post('/login', (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password
	};
	errors = {};
	if (validate(user)) {
		return res.status(400).json(errors);
	}
	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			userToken = token;
			return res.json({ token: userToken });
		})
		.catch((error) => {
			console.log(error);
			if (error.code === 'auth/wrong-password') {
				return res.status(403).json({ message: 'Wrong credentials, please try again.' });
			} else {
				return res.status(500).json({ error: error.code });
			}
		});
});

exports.api = functions.region('europe-west1').https.onRequest(app);

const validate = (newUser) => {
	errors = {};
	if (isEmpty(newUser.email)) {
		errors.email = 'Email address is mandatory!';
	} else if (!isEmail(newUser.email)) {
		errors.email = 'Email address not valid!';
	}
	if (newUser.userName && isEmpty(newUser.userName)) {
		errors.userName = 'Username is mandatory!';
	}
	if (isEmpty(newUser.password)) {
		errors.password = 'Password is mandatory!';
	}
	if (newUser.password && newUser.confirmPassword && newUser.password !== newUser.confirmPassword) {
		errors.confirmPassword = "Password don't match!";
	}
	if (newUser.name && newUser.familyName && (isEmpty(newUser.name) || isEmpty(newUser.familyName))) {
		errors.name = 'Name and family name are mandatory fields!';
	}
	return Object.keys(errors).length > 0 ? true : false;
};
