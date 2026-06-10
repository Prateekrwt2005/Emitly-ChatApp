import express from 'express';
import authRoutes from './routes/auth.route.js';
import path from "path";
import fs from "fs";
import connectDB from './lib/db.js';
import { ENV } from './lib/env.js';
import cookieParser from 'cookie-parser';
import messageRoutes from './routes/message.route.js';
import groupRoutes from './routes/group.route.js';
import secretRoutes from './routes/secret.route.js';
import cors from 'cors';
import {app, server} from './lib/socket.js';
import { startScheduler } from './lib/scheduler.js';


const _dirname= path.resolve();


const PORT= ENV.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors({  origin: ENV.CLIENT_URL,  credentials: true }));
app.use(cookieParser());

app.use("/api/auth",authRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/groups",groupRoutes);
app.use("/api/secret",secretRoutes);

if(ENV.NODE_ENV==="production"){
  const frontendDistPath = path.join(_dirname, "../frontend/dist");
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get("*", (_, res) => {
      res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  } else {
    app.get("/", (_, res) => {
      res.json({ status: "ok", message: "Emitly API is running" });
    });
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
  startScheduler();
});