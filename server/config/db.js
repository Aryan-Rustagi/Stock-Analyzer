const mongoose = require('mongoose');

async function connectDb(){
	try{
		const conn= await mongoose.connect(process.env.MONGO_URI);

		console.log("Connected to database");
	}
	catch(error){
		console.log( console.error("MongoDB connection failed:", error.message));
		process.exit(1);
	}
};

module.exports = connectDb;