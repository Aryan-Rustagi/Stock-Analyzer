
const mongoose= require('mongoose');

async function connectDb(){
	try{
	  if(!process.env.MONGO_URI){
		throw new Error("MONGO_URI is not defined");
	  }

	  await mongoose.connect(process.env.MONGO_URI);
	  console.log("Connected to database");
	}
	catch(error){
		console.log("Error: ",error.message);
		process.exit(1);

	}
}

module.exports=connectDb;
