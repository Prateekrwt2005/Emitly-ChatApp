import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    console.log("REQ BODY:", req.body); // 🔥 DEBUG

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
       fullName: fullName, // ✅ mapping
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

generateToken(savedUser._id, res); 

    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName, // ✅ return as fullName
      email: savedUser.email,
      profilePic: savedUser.profilePic,
      bio: savedUser.bio || "",
      customStatus: savedUser.customStatus || { emoji: "", text: "" },
    });

  } catch (err) {
    console.log("Error in signup controller:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    // never tell the client which one is incorrect: password or email

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio || "",
      customStatus: user.customStatus || { emoji: "", text: "" },
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_, res) => {
  res.cookie("token", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: ENV.NODE_ENV === "development" ? "lax" : "none",
    secure: ENV.NODE_ENV === "development" ? false : true,
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, customStatus } = req.body;
    const userId = req.user._id;
    const updateData = {};

    if (profilePic) {
      // ✅ Check format (base64)
      if (!profilePic.startsWith("data:image")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      // ✅ CHECK SIZE
      if (profilePic.length > 2000000) {
        return res.status(400).json({ message: "Image too large" });
      }

      console.log("Uploading image...");
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "emitly_profiles",
        resource_type: "image",
      });
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (customStatus !== undefined) {
      updateData.customStatus = {
        emoji: customStatus.emoji || "",
        text: customStatus.text || "",
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("🔥 FULL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};