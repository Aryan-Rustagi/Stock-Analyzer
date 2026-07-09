const express= require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const connectDb=require('./config/db.js')

dotenv.config();

const app=express();

const PORT=process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/",function(req,res){
    res.send("Welcome to the server ");
});

async function startServer(){
    await connectDb();

    app.listen(PORT,function(){
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch(function(error){
    console.log("Server failed to start:", error.message);
    process.exit(1);
});