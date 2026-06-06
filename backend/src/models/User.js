import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    profilePic:{
        type:String,
        default:""
    },
    bio:{
        type:String,
        default:""
    },
    customStatus:{
        emoji:{
            type:String,
            default:""
        },
        text:{
            type:String,
            default:""
        }
    },
    blockedUsers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{timestamps:true});             
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;