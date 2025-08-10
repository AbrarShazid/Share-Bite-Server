const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const admin = require("firebase-admin");


const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://share-bite.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send("Forbidden");
  }
};

const port = process.env.PORT || 5000;

require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@shazid.sdvbyar.mongodb.net/?retryWrites=true&w=majority&appName=Shazid`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db("ShareBite").collection("foods");
    const requestCollection = client.db("ShareBite").collection("foodRequest");

    // api
    app.post("/foods", verifyToken, async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    });

    // 6 food item for feature

    app.get("/featured-foods", async (req, res) => {
      try {
        const featuredFoods = await foodCollection
          .find({ availability: "Available" })
          .sort({ quantity: -1 })
          .limit(6)
          .toArray();

        res.send(featuredFoods);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch featured foods." });
      }
    });

    // all available food

    app.get("/available-food", async (req, res) => {
      try {
        const { sort, search } = req.query;
        let sortOption = {};
        let filter = { availability: "Available" };

        if (search) {
          filter.name = { $regex: search, $options: "i" };
        }

        if (sort === "expire-asc") {
          sortOption = { expire: 1 }; // Ascending
        } else if (sort === "expire-desc") {
          sortOption = { expire: -1 }; // Descending (
        }

        const allfoods = await foodCollection
          .find(filter)
          .sort(sortOption)
          .toArray();
        res.send(allfoods);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch featured foods." });
      }
    });
    // food details
    app.get("/food-details/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await foodCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({
          error: "Internal server error",
          details: error.message
        });
      }
    });

    // change status after request

    app.patch("/status-change/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { availability: "Requested" } }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send();
      }
    });

    // individual data fetch by mail

    app.get("/mydata/:mail", verifyToken, async (req, res) => {
      const userMail = req.params.mail;
      const result = await foodCollection
        .find({ userEmail: userMail })
        .toArray();
      res.send(result);
    });

    // delete data
    app.delete("/foods/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update data fully

    app.put("/foods/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      try {
        const result = await foodCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update food item" });
      }
    });

    // --------------------------------------------->>>>> food request api <<<<-----------------------------------------------

    // post
    app.post("/requestFood", verifyToken, async (req, res) => {
      const request = req.body;
      const result = await requestCollection.insertOne(request);
      res.send(result);
    });

    // fetch requested food
    app.get("/myReqFood", verifyToken, async (req, res) => {
      const mail = req.user.email;

      if (!mail) {
        return res.status(400).send({ error: "User email not found in token" });
      }

      const result = await requestCollection
        .find({ userEmail: mail })
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Carrer code cooking");
});

app.listen(port, () => {
  console.log("shazid");
});
