const express = require('express');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middle ware

app.use(cors());
app.use(express.json());




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
    app.get('/job_application', async (req, res) => {
      const email = req.query.email;
      const query={
applicants_email:email}
      const cursor = jobsApplicationsCollections.find(query);
      const result = await cursor.toArray();

      for (const application of result) {
        console.log(application.
          job_id)
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
      const data = req.body;
      const result = await jobsApplicationsCollections.insertOne(data);
      res.send(result);

    })
    app.get('/jobs', async(req, res) => {
      const cursor = jobsCollection.find();
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