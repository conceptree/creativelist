/* eslint-disable consistent-return */
const {db} = require('../util/admin');

exports.getCollection = (req, res) => {
	db.collection('collection')
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
		.catch((error) =>{ 
			console.log(error);
			res.status(500).json({error:error.code});
		});
};

exports.postItem = (req, res) => {
	if(req.body.body.trim() === ''){
		return res.status(400).json({body:'Body must not be empty'});
	}

	const newItem = {
		name: req.body.name,
		description: req.body.description,
		url: req.body.url,
		type: req.body.type,
		origin: req.body.origin,
		createdBy: req.user.userName ? req.user.userName : null,
		createdAt: new Date().toISOString()
	};

	db.collection('collection')
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
};