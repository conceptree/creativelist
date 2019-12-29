const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

exports.getCollection = functions.https.onRequest((req, res) => {
    admin.firestore().collection('collection').get().then( data => {
        let collection = [];
        data.forEach(doc=>{
            collection.push(doc.data());
        });
        return res.json(collection);
    }).catch(err => console.log(err));
});

exports.saveItem = functions.https.onRequest((req, res) => {
    const newItem = {
        name:req.body.name,
        description:req.body.description,
        url:req.body.url,
        type:req.body.type,
        origin: req.body.origin,
        createdAt:admin.firestore.Timestamp.fromDate(new Date())
    }

    admin.firestore.collection('collection').add(newItem).then(doc => {
        return res.json({ message: `document ${doc.id} created successfully`});
    }).catch(error =>{
        res.status(500).json({error:'Something went wrong!'})
        console.log(error);
    });
});