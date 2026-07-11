const express=require('express');
const app=express();

const cors=require('cors');

const dotenv=require('dotenv');

const connectDb=require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDb().catch((error) => {
    console.error('Database initialization skipped:', error.message);
});

app.use(cors());
app.use(express.json());

app.get('/',function(req,res){
   res.send("Welcome to the stock analyzer");
});

app.listen(PORT,function(){
    console.log("Server is running ");
});


