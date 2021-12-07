import express from "express";
import jwt from "jsonwebtoken";
import secrets from "./secrets/admin_secret.js";
import users from "./model/users.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import cors from "cors";

try {
  mongoose.connect(secrets.mongodb_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (error) {
  //   console.log(error);
  console.log("Moongoose connection error");
}

const app = express();
app.use(cors({ origin: "https://sabirauthbackend.herokuapp.com/" }));
app.use(express.json());

app.get("/userprofile", authToken, async (req, res) => {
  // parameters needed ..... Auth token
  const user_details = await users.findOne({ email: req.body.email });
  console.log(user_details);
  res.status(200).json(user_details);
});

app.post("/api/signup", async (req, res) => {
  // email, password, firstName ,
  const { email, password, firstName, lastName, phone, address } = req.body;
  if (!(email && password && firstName)) {
    return res.status(400).json({ message: "invalid user ID or Password" });
  }
  const userData = await users.findOne({ email: email });
  if (userData) {
    return res.status(403).json({ messsage: "User already exists" });
  }
  const tempUser = {
    email: email,
    firstName: firstName,
  };
  const accessToken = jwt.sign(tempUser, secrets.jwt_secret);
  const hash = await bcrypt.hash(password, 10);
  const newUser = await users.create({
    email: email,
    password: hash,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    address: address,
    tokens: [
      {
        token_id: accessToken,
      },
    ],
  });

  const message = "Sign Up successful!";
  res.status(200).json({ accessToken, tempUser, message });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const userData = await users.findOne({ email: email });
  if (!userData) {
    return res.status(403).json({ message: "User does not exists!" });
  }

  if (
    userData.email === email &&
    (await bcrypt.compare(password, userData.password))
  ) {
    const tempUser = { email: email, firstName: userData.firstName };
    const accessToken = jwt.sign(tempUser, secrets.jwt_secret);
    return res.status(200).json({ accessToken, tempUser });
  }
  return res.status(403).json({ message: "Email or password is invalid!!" });
});

/* app.delete("/api/logout", authToken, async (req, res) => {
  const userData = await users.findOne({ email: req.user.email });
  userData.tokens.length = 0;
  userData.save();
}); 
*/

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  //console.log(authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  //console.log(token);
  if (token == null) {
    return res.status(401).json({ message: "Not a valid token" });
  }
  jwt.verify(token, secrets.jwt_secret, (err, tempUser) => {
    //console.log(tempUser);
    if (err) return res.status(403).json({ message: "Not a valid request" });
    const validity = async () => {
      const userData = await users.findOne({ email: tempUser.email });
      // console.log(userData)
      const tokens = userData.tokens;
      const validToken = tokens.reduce((item) => {
        if (item.token_id === token) return true;
      });
      if (validToken) return true;
    };
    if (!validity) {
      res.status(403).json({ message: "Token is no longer valid!" });
    }

    req.body.email = tempUser.email;
    req.body.token = token;
  });
  next();
}

app.listen(secrets.port || 8080, () => {
  console.log(`server is running on port ${secrets.port || 8080}`);
});
