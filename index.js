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
    const sessionCollection = database.collection('session');

    //verification releted
    const verifyToken =async (req, res, next) =>{
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  
  if(!token){
   return res.status(401).json({ message: "Unauthorized access" }); 
  }
  const query = { token : token}
  const session = await sessionCollection.findOne(query)
  
  const userId = session.userId

  const userQuery={
    _id : userId
  }
  const user = await userCollection.findOne(userQuery)
  if (!user) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            req.user = user;
  next()
}

const verifySeeker = (req, res, next) => {
  if (req.user.role !== "seeker") {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  next();
};
const verifyRecruiter = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();
};
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();
};

    //application
     app.post("/applications",verifySeeker,verifyToken, async (req,res)=>{
        const job = req.body ;
        const newJob={
          ...job,
          createdAt : new Date()
        }
        const result = await applicationCollection.insertOne(newJob);
        res.send(result)
    })

    app.get('/applications',verifyToken,verifySeeker,async(req,res)=>{
      const query ={}
      if(req.query.applicantId){
        query.applicantId=req.query.applicantId
        //chack applicant id
        console.log(req.user,req.query.applicantId)
        if(req.user._id.toString() !== req.query.applicantId){
          return status(403).send({message: "Forbidden"})
        }
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
    app.post("/jobs",verifyToken,verifyRecruiter, async (req,res)=>{
        const job = req.body ;
        const newJob={
          ...job,
          createdAt : new Date()
        }
        const result = await jobCollection.insertOne(newJob);
        res.send(result)
    })

    app.get("/jobs",async(req,res)=>{
      
      //company releted quarys
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
      //public quary all type of search 
      const query = {}

      if(req.query.search){
        query.$or=[
          { jobTitle :{ $regex: req.query.search, $options: 'i' } },
          { companyName :{ $regex: req.query.search, $options: 'i' } },
        ]
      }
      if(req.query.jobType){
        query.jobType = req.query.jobType
      }
      if(req.query.jobCategory){
        query.jobCategory = req.query.jobCategory
      }
      if(req.query.isRemote){
        query.isRemote = req.query.isRemote === "true"
      }
    if (req.query.page) {
        const page = req.query.page;
        const perPage = req.query.perPage || 12;
        const skipItems = (page - 1) * perPage

        const total = await jobCollection.countDocuments(query);
        const cursor = jobCollection.find(query).skip(skipItems).limit(perPage);
        const jobs = await cursor.toArray();
        return res.send({ total, jobs });
    }
       const carsor = jobCollection.find(query)
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

    app.get("/company",verifyToken,verifyAdmin,async(req,res)=>{
      const carsor = companyCollection.find()
      const result = await carsor.toArray()
      res.send(result)
    })
    
    app.patch("/company/:id",verifyToken,async(req,res)=>{
      const id= req.params.id
      const updatedCompany = req.body
      const filter = {_id : new ObjectId(id)}
      const updatedStatus = {
        $set : {status : updatedCompany.status}
      }
      const result = await companyCollection.updateOne(filter,updatedStatus)
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