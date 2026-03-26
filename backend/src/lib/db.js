import mongoose from "mongoose";

const connectDB=async()=>{
    try {
        const {MONGO_URI}=process.env;
        if(!MONGO_URI){
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        const conn=await mongoose.connect(process.env.MONGO_URI)
            console.log("mongoose connected",conn.connection.host);
    }
        
     catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

export default connectDB;