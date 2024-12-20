const express = require('express');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middle ware

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials:true,
}));
app.use(express.json());
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jo0u1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

  const jobsCollection = client.db('job-portal').collection('jobs');
  const jobsApplicationsCollections=client.db('job-portal').collection('applications')
  try {


    // auth related api's
    app.post('/logOut', (req, res) => {
      res.
        clearCookie('token',{
          httpOnly: true,
          secure: false,
       })
      .send({success:true})
    })
    app.post('/jwt',(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' })

      res.
          cookie('token', token, {
            httpOnly: true,
            secure:false,
          })
          .send({success:true})
    })
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result)
    })


    app.delete('/job_application/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsApplicationsCollections.deleteOne(query)
      res.send(result);
    })


    app.get('/job_application/jobs/:job_id', async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobsApplicationsCollections.find(query).toArray();
      res.send(result)
    })
    app.patch('/job_application/:id', async (req, res) => {
      const id = req.params.id;
      const statusData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: statusData,
        }
      }
      const result = await jobsApplicationsCollections.updateOne(filter, updateDoc);
      res.send(result)
})

    app.get('/job_application', async (req, res) => {
      const email = req.query.email;
      const query={
applicants_email:email}
      const cursor = jobsApplicationsCollections.find(query);
      const result = await cursor.toArray();

      for (const application of result) {
        // console.log(application.
        //   job_id)
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location=job.location
        }

      }


      res.send(result)

    })
    app.post('/addNewJob', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result)
    })
    app.post('/job_applications', async (req, res) => {
      const application = req.body;
      const result = await jobsApplicationsCollections.insertOne(application);

      // const id = application.job_id;
      // const query = { _id: new ObjectId(id) };
      // const job = await jobsCollection.findOne(query);
      // const newCount = 0;
      // if (job.applicationCount) {
      //    newCount = job.applicationCount + 1;

      // } else {
      //   newCount=1
      // }


      // // now update the info

      // const filter = { _id: new ObjectId(id) };
      // const updateDoc = {
      //   $set: {
      //     applicationCount: newCount,
      //   }
      // }
      // const updateResult = await jobsCollection.updateOne(filter,updateDoc);
      res.send(result);

    })
    app.get('/jobs', async(req, res) => {

      const email = req.query.email;
      let query = {};
      if (email) {
        query={hr_email:email}
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('job falling on the sky ')
})
app.listen(port, () => {
  console.log('job-hunter running on port :', port)
})