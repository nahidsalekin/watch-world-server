const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config();
var admin = require("firebase-admin");

const app = express();
const port = 5000;

//firebase admin


// var serviceAccount = require('./traveloop-a3bcb-firebase-adminsdk-dms1a-94d9cedb74.json');

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fiuyj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    console.log(req.headers.authorization)
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodedUserEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}
async function run() {
    try {
        await client.connect();
        const db = client.db('watchy_world');
        const watchesCollection = db.collection('watches');
        const usersCollection = db.collection('user');
        const ordersCollection = db.collection('orders');

        //get api
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
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = email ? { email: email } : {};
            console.log('sdads', query)
            const data = await ordersCollection.find(query).toArray();
            res.send(data);
        });

        //post api
        app.post('/watches', async (req, res) => {
            const watch = req.body;
            const result = await watchesCollection.insertOne(watch);
            res.json(result)
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
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        });
        //update
        app.put('/orders/:id', async (req, res) => {
            const id = { _id: ObjectId(req.params.id) };
            console.log(id._id)
            const filter = { _id: id._id };
            const updateDoc = { $set: { status: 'shipped' } };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result)
        })

        //users
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
            console.log(user, user.email)
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