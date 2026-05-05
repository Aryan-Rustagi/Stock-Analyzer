const express=require ('express');
const cors=require('cors');
const app=express();

const PORT =process.env.PORT|| 5000;

app.use(cors());

app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Hello this is the starting of our code");
});

app.get('/user',(req,res)=>{
    res.json({
        "name": 'aryan',
        "age": 20,
    });
});

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`);
});
