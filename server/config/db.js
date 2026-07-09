const mongoose=require('mongoose');

async function connectDb(){
	try{
<<<<<<< HEAD
		const conn= await mongoose.connect(process.env.MONGO_URI);

		console.log("Connected to database");
=======

	  const conn=await mongoose.connect(process.env.MONGO_URI);
	  console.log("Connected to database");
>>>>>>> 80b0f5e (Router)
	}
	catch(error){
		console.log( console.error("MongoDB connection failed:", error.message));
		process.exit(1);
	}
};

module.exports = connectDb;