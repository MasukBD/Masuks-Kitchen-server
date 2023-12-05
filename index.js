const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


// middleware 
app.use(cors());
app.use(express.json());

// JWT ServerSite::Step=2 create a verify function  
const verifyJWTToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "unauthorized access" });
    };
    // IN genaral we will get token from client site as 'bearer token' 
    // * so we split here the authorization which we take from client site headers
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
}


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



        // To Verify Admin MiddleWare 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }
            next();
        }


        // JWT Serversite::STEP=1 At First npm install jwt then require jwt then start from here 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "10h" })
            res.send({ token });
        })

        // User Handle API start Here 
        app.get('/users', verifyJWTToken, verifyAdmin, async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // Check a User if he/she Admin or Not 
        app.get('/user/:email', verifyJWTToken, async (req, res) => {
            const email = req.params?.email;

            if (req.decoded.email !== email) {
                // return res.status(403).send({error: true, message: "unauthorized access"}) 
                // or 
                return res.send({ admin: false });
            }

            query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role == 'admin' };
            res.send(result);
        })

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

        // Set A User As Admin API
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


        // JWT Serversite:STEP=3 use verifyJWTToken to those API's, you want to secure

        // handle Cart Items API down from here
        app.get('/carts', verifyJWTToken, async (req, res) => {
            let query = {};
            const email = req.query?.email;
            //JWT Serversite::STEP=4 check the token bearer and the user who requested for are the same 
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }
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