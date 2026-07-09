const express= require('express');
const cors=require('cors');

const app=express();

const PORT=5000;

app.use(cors());

app.get("/",function(req,res){
    res.send("Welcome to the server ");
});

app.listen(PORT,function(){
    console.log("Server is running ");
});