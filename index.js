import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wanderlust");
const destinationCollection = db.collection("destination");
const bookingCollection = db.collection("bookings");

const verifyToken = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
  return res.status(404).send({ msg: "unauthorized access" });
  }
 const token = authHeader.split(" ")[1]
if(!token) {
  return res.status(404).send({ msg: "unauthorized access" });
}

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_PUBLIC_URL}/api/auth/jwks`));
try{
  const {payload}= await jwtVerify(token, JWKS)
  next()
}
catch{
  return res.status(500).send({msg: "server error"})
}



};

app.post("/add-destination", verifyToken, async (req, res) => {
  const data = req.body;

  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get("/destination/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.patch("/destination/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await destinationCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    { $set: updatedData },
  );
  res.json(result);
});

app.delete("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
});

app.post("/booking", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send({ message: "server is running fine1" });
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

export default app;