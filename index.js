const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


// middleware 
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.y1dis5d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        // Database Collections 
        const usersCollection = client.db("MasuksKitchenDB").collection("users");
        const MenuCollection = client.db("MasuksKitchenDB").collection("menu");
        const ReviewCollection = client.db("MasuksKitchenDB").collection('reviews');
        const CartCollecttion = client.db('MasuksKitchenDB').collection('carts');


        // User Handle API start Here 
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const isExistingUser = await usersCollection.findOne(query);
            if (isExistingUser) {
                return res.send({ message: 'User Already Exist on User List!' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.patch('/users/:id', async (req, res) => {
            const id = req.params?.id;
            const filter = { _id: new ObjectId(id) };
            const updatedInfo = req.body;
            const updatedData = {
                $set: {
                    role: updatedInfo.role
                }
            };
            const result = await usersCollection.updateOne(filter, updatedData);
            res.send(result);
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


        // Menu Handle API Here 
        app.get('/menu', async (req, res) => {
            const cursor = MenuCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        // Customer Review Handle API here 
        app.get('/reviews', async (req, res) => {
            const cursor = ReviewCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        // handle Cart Items API down from here

        app.get('/carts', async (req, res) => {
            let query = {};
            const email = req.query?.email;
            if (req.query?.email) {
                query = { email: email };
            }
            const cursor = CartCollecttion.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/carts', async (req, res) => {
            const cart = req.body;
            const result = await CartCollecttion.insertOne(cart);
            res.send(result);
        });

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: new ObjectId(id) };
            const result = await CartCollecttion.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Masuk's Kitchen Restaurant Server is Running Successfull!");
});

app.listen(port, () => {
    console.log(`Masuk's Kitchen Running on Port ${port}`);
});