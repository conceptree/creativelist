/* eslint-disable consistent-return */
const {db, admin} = require('../util/admin');
const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);

const {validateSignUpData, validateLoginData} = require('../util/validators');

/// SIGNUP
exports.signUp = (req, res) => {
	const newUser = {
		userName: req.body.userName,
		email: req.body.email,
		name: req.body.name,
		familyName: req.body.familyName,
		newsletter: req.body.newsletter,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	};

	const {valid, errors} = validateSignUpData(newUser);

	if(!valid){
		return res.status(400).json(errors);
	}

	const defaultImage = 'defaultUser.png';

	let userToken, userId;

	db.doc(`/users/${newUser.userName}`)
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
				name:newUser.name,
				familyName:newUser.familyName,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				imageUrl:`https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/0/${defaultImage}?alt=media`,
				userId
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
};

/// LOGIN
exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password
	};

	const {valid, errors} = validateLoginData(user);
	
	if(!valid){
		return res.status(400).json(errors);
	}

	firebase.auth()
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
};

// USER IMAGE UPLOAD
exports.uploadImage = (req, res)=>{
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');

	const busboy = new BusBoy({headers:req.headers});

	let imageFileName;
	let imageToUpload = {};

	busboy.on('file', (fieldname, file, filename, encoding, mimetype)=>{
		console.log(filename);
		console.log(fieldname);
		console.log(mimetype);
		const imageExt = fieldname.split('.')[filename.split('.').length - 1];
		imageFileName = `${Math.round(Math.random()*10000000000)}.${imageExt}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToUpload = {filePath, mimetype};
		file.pipe(fs.createWriteStream(filePath));
	});

	busboy.on('finish', ()=>{
		admin.storage().bucket().upload(imageToUpload.filePath, {
			resumable:false,
			metadata:{
				metadata:{
					contentType: imageToUpload.mimetype
				}
			}
		}).then(() => {
			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/0/${imageFileName}?alt=media`;
			return db.doc(`/users/${req.user.handle}`).update({imageUrl});
		}).then(()=>{
			return res.json({message: 'Image uploaded successfully!'})
		}).catch((err)=>{
			console.log(err);
			return res.status(500).json({error:err.code});
		})
	});

};