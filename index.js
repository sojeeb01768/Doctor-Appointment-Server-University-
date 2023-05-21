const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query } = require('express');
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DBUser}:${process.env.DBPassword}@cluster0.kvqywrf.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const consultationCollection = client
      .db("university-project")
      .collection("consultation");
    const doctorsCollection = client
      .db("university-project")
      .collection("doctors");
    const bookingsCollection = client
      .db("university-project")
      .collection("bookings");
    const usersCollection = client.db("university-project").collection("users");


        //NOTE:  make sure you use varifyAdmin after verifyJWT
        const verifyJWT = async (req, res, next) => {
            // console.log("inside verifyJWT", req.headers.authorization);
            const authHeader = req.headers.authorization;

            // const decodedEmail = req.decoded.email;
            // const query = { email: decodedEmail };
            // const user = await usersCollection.findOne(query);

            if (!authHeader) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })
        }




        // consultation data
        app.get('/consultation', async (req, res) => {
            const query = {};
            const consultation = await consultationCollection.find(query).toArray();
            res.send(consultation);
        });

    // consultation with id
    app.get("/consult/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { id: id };
      const consult = await doctorsCollection.find(query).toArray();
      res.send(consult);
    });

        //use aggregate to query multiple collection and then merge data
        //get all doctors
        app.get('/doctors', async (req, res) => {
            const date = req.query.date;
            const search = req.query.search;
            console.log(search);
            let query = {};
            if (search.length) {
                query = {
                    $text: {
                        $search: search
                    }
                }
            }
            const doctors = await doctorsCollection.find(query).toArray();

            //get the booking of the provided date
            const bookingQuery = { appointmentDate: date }
            const bookedSlot = await bookingsCollection.find(bookingQuery).toArray();
            // query for removing booked slot and show available slot
            doctors.forEach(doctor => {
                const slotBooked = bookedSlot.filter(book => book.doctorName === doctor.name)
                const bookedSlots = slotBooked.map(book => book.slot)
                const remainingSlots = doctor.slots.filter(slot => !bookedSlots.includes(slot))
                doctor.slots = remainingSlots;
                // console.log(date, doctor.name, remainingSlots.length);
            })
            res.send(doctors);
        })


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
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.patientEmail,
                doctor: booking.doctorName
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You  Already have an Booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
        // jwt token access for user
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ accessToken: '' })

        })

        // get all users from data base
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        // save users data to database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        // secure admin route by varify admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.category === 'admin' });
        })



        // Make users admin 
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.category !== 'admin') {
                return res.send(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    category: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })


        // get booking data to dashboard
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            // console.log(email);
            // console.log('token', req.headers.authorization);
            const query = { patientEmail: email };
            // console.log(query);
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })



    }

  
  finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("doctors portal server  is running");
});

app.listen(port, () => console.log(`doctors portal running on ${port}`));
