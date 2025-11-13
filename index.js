

// const requireSuperAdmin = async (req, res, next) => {
//   try {
//     const user = await usersCollection.findOne({ email: req.user.email });
//     if (user?.role !== "super-admin") {
//       return res.status(403).send({ error: "Super admin access required" });
//     }
//     next();
//   } catch (error) {
//     return res.status(403).send({ error: "Forbidden" });
//   }
// };

// const requireAdmin = async (req, res, next) => {
//   try {
//     const user = await usersCollection.findOne({ email: req.user.email });
//     if (!['admin', 'super-admin'].includes(user?.role)) {
//       return res.status(403).send({ error: "Admin access required" });
//     }
//     next();
//   } catch (error) {
//     return res.status(403).send({ error: "Forbidden" });
//   }
// };

// // Check if user is banned
// const checkBanned = async (req, res, next) => {
//   try {
//     const user = await usersCollection.findOne({ email: req.user.email });
//     if (user?.isBanned) {
//       return res.status(403).send({ error: 'Your account has been banned' });
//     }
//     next();
//   } catch (error) {
//     return res.status(403).send({ error: 'Forbidden' });
//   }
// };



// async function run() {

//   try{
//     foodCollection = client.db("ShareBite").collection("foods");
//    requestCollection = client.db("ShareBite").collection("foodRequest");
//    usersCollection = client.db("ShareBite").collection("users");


//     // // Get user data by email
//     // app.get("/user/:email", verifyToken, async (req, res) => {
//     //   try {
//     //     const email = req.params.email;
//     //     const user = await usersCollection.findOne({ email });
        
//     //     if (!user) {
//     //       return res.status(404).send({ error: "User not found" });
//     //     }
        
//     //     res.send(user);
//     //   } catch (error) {
//     //     res.status(500).send({ error: "Failed to fetch user data" });
//     //   }
//     // });

  

//     // Super Admin APIs
//     app.get("/admin/all-users", verifyToken, requireSuperAdmin, async (req, res) => {
//       try {
//         const users = await usersCollection.find({}).toArray();
//         res.send(users);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to fetch users" });
//       }
//     });

//     app.get("/admin/admins", verifyToken, requireSuperAdmin, async (req, res) => {
//       try {
//         const admins = await usersCollection.find({ 
//           role: { $in: ["admin", "super-admin"] } 
//         }).toArray();
//         res.send(admins);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to fetch admins" });
//       }
//     });

//     app.patch("/admin/update-role", verifyToken, requireSuperAdmin, async (req, res) => {
//       try {
//         const { userId, newRole } = req.body;
        
//         if (!["user", "admin"].includes(newRole)) {
//           return res.status(400).send({ error: "Invalid role" });
//         }
        
//         const result = await usersCollection.updateOne(
//           { _id: new ObjectId(userId) },
//           { $set: { role: newRole } }
//         );
        
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to update user role" });
//       }
//     });

//     // Admin APIs
//     app.patch("/admin/ban-user", verifyToken, requireAdmin, async (req, res) => {
//       try {
//         const { userId } = req.body;
        
//         const result = await usersCollection.updateOne(
//           { _id: new ObjectId(userId) },
//           { 
//             $set: { 
//               isBanned: true,
//               bannedBy: req.user.email,
//               bannedAt: new Date()
//             } 
//           }
//         );
        
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to ban user" });
//       }
//     });

//     app.patch("/admin/unban-user", verifyToken, requireAdmin, async (req, res) => {
//       try {
//         const { userId } = req.body;
        
//         const result = await usersCollection.updateOne(
//           { _id: new ObjectId(userId) },
//           { 
//             $set: { 
//               isBanned: false,
//               bannedBy: null,
//               bannedAt: null
//             } 
//           }
//         );
        
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to unban user" });
//       }
//     });

//     app.delete("/admin/foods/:id", verifyToken, requireAdmin, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to delete food item" });
//       }
//     });








const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();


const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://share-bite-a11.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());




const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



const verifyToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send({ error: "Unauthorized: missing Authorization header" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).send({ error: "Unauthorized: malformed Authorization header" });
  }

  const token = parts[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(403).send({ error: "Forbidden: invalid token" });
  }
};



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
    const usersCollection = client.db("ShareBite").collection("users");









  //save user in mongodb :

  app.post("/save-user", async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email });
    
    if (existingUser) {
      return res.status(200).send({ message: "User already exists", user: existingUser });
    }
    
    // Add additional fields
    userData.createdAt = new Date();
    userData.role = "user"; 
    userData.isBan=false;
    
    const result = await usersCollection.insertOne(userData);
    res.send(result);
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).send({ error: "Failed to save user to database" });
  }
});

//role of a user 
app.get("/user/role/:email", verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
       
        if (req.user.email !== email) {
            return res.status(403).send({ error: "Forbidden access" });
        }

        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }
        
        // The default role you set in /save-user is 'user'
        res.send({ role: user.role }); 

    } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).send({ error: "Failed to fetch user role" });
    }
});





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