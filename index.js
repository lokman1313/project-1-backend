const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
const app = express()
const port = 5000
require('dotenv').config()


app.use(cors());
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const uri = process.env.MONGODB_URI;
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
    
    await client.connect();
    const database = client.db("project-1");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");
    const userCollection =database.collection("user")
    const applicationCollection=database.collection("application")
    const planCollection = database.collection('plans');
    const subscriptionCollection = database.collection('subscriptions');

    //application
     app.post("/applications",async (req,res)=>{
        const job = req.body ;
        const newJob={
          ...job,
          createdAt : new Date()
        }
        const result = await applicationCollection.insertOne(newJob);
        res.send(result)
    })

    app.get('/applications',async(req,res)=>{
      const query ={}
      if(req.query.applicantId){
        query.applicantId=req.query.applicantId
      }
      if(req.query.jobId){
        query.jobId=req.query.jobId
      }
      const carsor = applicationCollection.find(query)
      const result = await carsor.toArray()
      res.send(result || {})
    })
    //users
    app.get("/user",async(req,res)=>{
      const carsor = userCollection.find()
      const result = await carsor.toArray()
      res.send(result)
    })

    //jobs
    app.post("/jobs",async (req,res)=>{
        const job = req.body ;
        const newJob={
          ...job,
          createdAt : new Date()
        }
        const result = await jobCollection.insertOne(newJob);
        res.send(result)
    })

    app.get("/jobs",async(req,res)=>{
      const query = {};
      if(req.query.companyId){
        query.companyId = req.query.companyId
      }
      if(req.query.status){
        query.status = req.query.status
      }
      const cursor = jobCollection.find(query)
      const result = await cursor.toArray()
      res.send(result || {})
    })

    app.get("/all/jobs",async(req,res)=>{
       const carsor = jobCollection.find()
      const result = await carsor.toArray()
      res.send(result)
    })

    app.get("/all/jobs/:id",async(req,res)=>{
      const id = req.params.id
      const query = {
        _id : new ObjectId(id)
      }
      const result = await jobCollection.findOne(query)
      res.send(result)
    })

    //company releted codes

    app.get("/company",async(req,res)=>{
      const carsor = companyCollection.find()
      const result = await carsor.toArray()
      res.send(result)
    })

    app.get("/my/company",async(req,res)=>{
      const quary ={};
      if(req.query.userId){
        quary.userId = req.query.userId
      }
      const result = await companyCollection.findOne(quary)
        //company data null thakle error asbe tai  || {} eta dite hbe
      res.send(result || {})
    })

    app.post('/company',async(req,res)=>{ 
      const company = req.body
      const newCompany={
        ...company,
        createdAt : new Date()
      }
      const result= await companyCollection.insertOne(newCompany)
      res.send(result)
    })

    // plans 
        app.get('/plans', async (req, res) => {
            const query = {}
            if (req.query.plan_id) {
                query.id = req.query.plan_id
            }
            const plan = await planCollection.findOne(query);
            res.send(plan)
        })

    //subscription
    app.post("/subscription",async(req,res)=>{
       const data = req.body;
            const subsInfo = {
                ...data,
                createdAt: new Date()
            }

            const result = await subscriptionCollection.insertOne(subsInfo);
            //udate user plan info
            const filter = {email : data.email}

            const updatedDocument ={
              $set: {
                plan : data.planId
              }
            }
            const updatedresult= await userCollection.updateOne(filter,updatedDocument)
            res.send(updatedresult)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);