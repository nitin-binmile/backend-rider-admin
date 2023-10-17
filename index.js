import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import fs from 'fs/promises';
import multer from "multer";
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: true });
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// app.use(express.static('public'))

app.post("/uploadRecordedVideo",multer().single("video"),(req,res)=>{
  console.log(req);
    console.log(req.file);
    fs.writeFile(req.file.originalname,req.file.buffer);
    res.send("file received");

})

const rideIdToSocketId = new Map();


const sendRidesInfo = ()=>{

  io.to("admin").emit("totalActiveRides",rideIdToSocketId.size>0?Array.from(rideIdToSocketId.keys()):[]);
}
io.on("connection", (socket) => {
  console.log("new connection");

  socket.on("registerRide", ({ rideId }) => {
    rideIdToSocketId.set(rideId, socket.id);
    // rideIdToVideo.set(rideId,new Array());
    sendRidesInfo();
  });

  socket.on("registerAdmin", () => {
    socket.join("admin");
    sendRidesInfo()
  });

  
  socket.on("finishRide",async ({ rideId }) => {
    rideIdToSocketId.delete(rideId);
    sendRidesInfo()
  });
  socket.on("monitorRide",(ride)=>{
    console.log(ride);
    const rider = rideIdToSocketId.get(ride);
    console.log(rider);
    io.to(rider).emit("monitorRide",{adminId:socket.id});
  });
  socket.on("acceptMonitorRide",({offer,adminId})=>{
    io.to(adminId).emit("acceptMonitorRide",offer);
  })
  socket.on("answerFromAdminForAcceptMonitorRide",({answer,ride})=>{
    //  console.log(answer,ride)
     const rider = rideIdToSocketId.get(ride);
     io.to(rider).emit("answerFromAdminForAcceptMonitorRide",{answer,adminId:socket.id})

  })
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

server.listen(8000, () => {
  console.log("server running at http://localhost:8000");
});
