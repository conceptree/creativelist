/* eslint-disable no-useless-escape */
const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const {getCollection, postItem} = require('./handlers/entries');
const {signUp, login, uploadImage} = require('./handlers/users');

/// GET COLLECTION OF ENTRIES
app.get('/collection', getCollection);
// POST ITEM INTO COLLECTION
app.post('/item', FBAuth, postItem);
// User Routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);