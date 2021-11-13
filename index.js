const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fiuyj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const db = client.db('watchy_world');
        const watchesCollection = db.collection('watches');
        const usersCollection = db.collection('user');
        const ordersCollection = db.collection('orders');
        const reviewsCollection = db.collection('reviews');


        //-----------------
        //  Products API
        //-----------------
        app.get('/watches', async (req, res) => {
            const limit = parseInt(req.query.limit);
            const cursor = watchesCollection.find({}).limit(limit);
            const watches = await cursor.toArray();
            res.send(watches);
        });

        app.get('/watches/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const watch = await watchesCollection.findOne(query);
            res.send(watch);
        });

        app.delete('/watches/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await watchesCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/watches', async (req, res) => {
            const watch = req.body;
            const result = await watchesCollection.insertOne(watch);
            res.json(result)
        });

        //-----------------
        //  Reviews API
        //-----------------

        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result)
        });


        //-----------------
        //  Orders API
        //-----------------

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = email ? { email: email } : {};
            const data = await ordersCollection.find(query).toArray();
            res.send(data);
        });

        app.post('/place_order', async (req, res) => {
            const order = req.body;
            console.log(order)
            const result = await ordersCollection.insertOne(order);
            res.json(result)
        });

        //delete api
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        });
        //update
        app.put('/orders/:id', async (req, res) => {
            const id = { _id: ObjectId(req.params.id) };
            const filter = { _id: id._id };
            const updateDoc = { $set: { status: 'shipped' } };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result)
        })

        //-----------------
        //  Users API
        //-----------------
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result)

        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const options = { upsert: true }
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result)
        });

    } finally {
        //
    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running app')
});

app.listen(port, () => {
    console.log('running on port ', port);
});