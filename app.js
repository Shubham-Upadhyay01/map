

require("dotenv").config();
console.log("Twilio Account SID:", process.env.TWILIO_ACCOUNT_SID);
const twilio = require("twilio");


const accountSid = "ACe6e53eb8f7f1b86c9805677ca2577b08";
const authToken = "206e1328dcce1c267d80fdda88bf9072"; // Get this from Twilio
const twilioPhone = "+15075017260"; // Twilio phone number
const recipientPhone = "+919313799744"; // User's emergency contact number

const client = twilio(accountSid, authToken);

const exp = require('constants');
const express = require('express');
const app = express();
const path = require("path");
const http = require("http");

const server = http.createServer(app);

const socketio = require('socket.io');

const io = socketio(server);

app.use(express.json()); // Middleware to parse JSON

app.post("/sos", (req, res) => {
    const { latitude, longitude } = req.body;

    const message = `🚨 SOS Alert! 🚑 User needs help at:
    📍 Location: https://www.google.com/maps?q=${latitude},${longitude}`;

    client.messages
        .create({
            body: message,
            from: twilioPhone,
            to: recipientPhone,
        })
        .then((message) => {
            console.log("✅ SOS Sent:", message.sid);
            res.json({ success: true, message: "SOS sent successfully!" });
        })
        .catch((error) => {
            console.error("❌ Error sending SOS:", error);
            res.status(500).json({ success: false, error: "Failed to send SOS" });
        });
});

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));



io.on("connection", function(socket){
        socket.on("send-location", function(data){
            io.emit("receive-location",{id: socket.id, ...data});
        });
    socket.on("disconnect" , function(){
        io.emit("user-disconnected", socket.id);
    });
    
    socket.on("sos-accepted", (data) => {
        console.log("SOS Accepted:", data);
        io.to(data.id).emit("sos-confirmation", { message: "Help is on the way!", partnerLocation: data });
    });
    socket.on("sos-request", (data) => {
        console.log("SOS Request Received:", data);
        io.emit("new-sos", { id: socket.id, ...data });
    
        // Send SMS to partner
        client.messages.create({
            body: `Emergency Alert! A user needs help at (${data.latitude}, ${data.longitude}).`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "+919313799744"  // Replace with partner's phone number
        }).then(message => console.log("SMS Sent:", message.sid))
          .catch(error => console.error("Twilio Error:", error));
    });
    
    
    
});
 
app.get("/", function(req, res) {
    res.render("index");
});

server.listen(5001);
