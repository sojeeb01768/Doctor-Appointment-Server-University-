const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

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
        // consultation data
        app.get('/consultation', async (req, res) => {
            const query = {};
            const consultation = await consultationCollection.find(query).toArray();
            res.send(consultation);
        })
        // get doctors basis on speciality 
        app.get('/specialities/:speciality', async (req, res) => {
            const speciality = req.params.speciality;
            console.log(speciality);
            const query = { specialities: speciality };
            const doctors = await doctorsCollection.find(query).toArray();
            res.send(doctors)

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
