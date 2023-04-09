const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { query } = require('express');
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');

const app = express();

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DBUser}:${process.env.DBPassword}@cluster0.kvqywrf.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const consultationCollection = client.db('university-project').collection('consultation');
        const doctorsCollection = client.db('university-project').collection('doctors');
        const bookingsCollection = client.db('university-project').collection('bookings');
        const usersCollection = client.db('university-project').collection('users');

        // consultation data
        app.get('/consultation', async (req, res) => {
            const query = {};
            const consultation = await consultationCollection.find(query).toArray();
            res.send(consultation);
        });

        // consultation with id
        app.get('/consult/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { id: id };
            const consult = await doctorsCollection.find(query).toArray();
            res.send(consult)
        });
        // get doctors basis on speciality 
        app.get('/specialities/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { specialities: speciality };
            const doctors = await doctorsCollection.find(query).toArray();
            res.send(doctors)

        });
        // get single doctor basis on id 
        app.get('/doctor-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const doctor = await doctorsCollection.findOne(query);
            res.send(doctor)
        });

        // post booking data to database
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // save user data to database
        app.post('/users', async (req, res) => {
            const user=req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

    }


    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('doctors portal server  is running')
})

app.listen(port, () => console.log(`doctors portal running on ${port}`))
