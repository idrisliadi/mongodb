// import all middlewares/dependencies
   const express = require("express");
const server = express();
const cors = require("cors");
const multer = require("multer")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto") 
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const mongodb = require("mongodb")
// import dotenv and read the content in it
const dotenv = require("dotenv");
dotenv.config();
const client = new mongodb.MongoClient(process.env.DB_URL);
// use the imported middlewares/dependencies
server.use(cors());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "public/")));
// generate a secret key
const secretKey = crypto.randomBytes(64).toString("hex");
server.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}))
// set template engine
server.set("view engine", "ejs");
// read the content inside dotenv file
const port = process.env.PORT;
//read database name and collection then store it to a vairiable
const dbName = process.env.DB_NAME;
const table = process.env.TABLE
// create a route
server.get("/", (req, res) => {
    res.render("index");
})

// create a route for registering
server.get("/register", (req, res) => {
    res.render("register");
})
// process the registered data
server.post("/register", async(req, res)=>{
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const confirmpwd = req.body.confirmPassword.trim();
    const email = req.body.email.trim();
    if(username.length>0 || password.length>0 || confirmpwd.length>0 || email.length>0){
            if(password === confirmpwd){
                const hash = await bcrypt.hash(password, 10)
                const profile = {
                    username:username,
                    password:hash,
                    email:email
                   
                }
                //check the database if the user already exist
                const user = await client.db(dbName).collection
                (table).findOne({email:email})
                if (user){
                    if(user["email"] == email){
                        // res.send("user already exist")
                        res.render("error")
                    }
                    
                }else{  
                    //Save user info to the database
                    const db = await client.db(dbName).collection(table).insertOne(profile)
                    if (db){
                        // res.send("data inserted successfully")
                         res.redirect("/login")
                     }else{
                        res.send("unable to insert")
                    }
                }
                
               
                
                // res.send(secretKey)
                // jwt.sign(profile, "secretKey", (error, token)=>{
                //     if(error){
                //         res.send("validation issues")
                //     }else{
                //         req.session.secret = secretKey
                //         req.session.token = token
                //         res.cookie("usertoken", token).render("login", {profile:profile})
                //     }

                // })
                // res.send(profile)
            }else{
                res.send("invalid password match")
            }
    }else{
        res.send("invalid data passed")
    }
})
// login route
server.get("/login", (req, res)=>{
    res.render("login")
    
})


server.post("/login", (req, res)=>{
    const secretKey = req.session.secretKey
    const toks = req.session.token
    console.log({"token":toks, "secretkey": secretKey});
    // toks = res.cookie("usertoken")
    // console.log(req.cookie)
    const password = req.body.password.trim();
    const email = req.body.email.trim();
    const profile = {
        password:password,
        email:email
    }
    // res.send(profile)
    jwt.verify(toks, "secretKey", (error, data)=>{
        if(error){
            res.send("invalid credentials")}
        else{
           res.render("dash", {data:data})
        }
        
    })
    
})
// logout route

// create an instance of a running server
server.post("/logout", (req,res)=>{
    res.clearCookie("usertoken")
    res.redirect("login")
})
//image upload route
const storage = multer.diskStorage({
destination: (req, file,cb)=>{
    cb(null , "public/images")
},
filename : (req,file, cb)=>{
    cb(null, file.originalname)
}
})
//activate multer storage setting
const upload = multer({storage:storage})
server.post("/uploader", upload.single('file1'), (req, res ,next)=>{
    const img = req.file.originalname
    const imgsize = req.file.size
    const img_title = req.body.img_Title
    const img_desc = req.body.img_desc
    res.send(img) 
    // if (imgsize > 5000){
    //     res.send("large size")
    // }
    // else{
    //     res.send("size is okay")
    }
        //({ img:img, img_title, img_des: img_desc})
)
server.listen(port, (error) => {
    if(error){
        console.log("unable to connect");
    }
    console.log(`server is running on port ${port}`);
    
})

