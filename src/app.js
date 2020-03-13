import http from "http";
import { env, mongo, port, ip, apiRoot } from "./config";
//import mongoose from "./services/mongoose";
import express from "./services/express";
import api from "./api";

const io = require("socket.io")(http);

const app = express(apiRoot, api);
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());

//mongoose.connect(mongo.uri);
//mongoose.Promise = Promise;

setImmediate(() => {
  const s = server.listen(port, ip, () => {
    console.log(
      "Express server listening on http://%s:%d, in %s mode",
      ip,
      port,
      env
    );

    runIo();
  });
  io.listen(s);
});

let AMBULANCE_LOCATIONS = {
  1: { lat: 32.7766642, lng: -96.7969879 }
};

app.post("/turnon", (req, res, next) => {
  const { lat, lng } = req.body;
  AMBULANCE_LOCATIONS[Object.keys(AMBULANCE_LOCATIONS).length + 1] = {
    lat,
    lng
  };
  io.emit("allLocations", AMBULANCE_LOCATIONS);
  res.status(200).send();
});

app.post("/updateLocation/:id", (req, res, next) => {
  const { id } = req.params;
  const { lat, lng } = req.body;
  AMBULANCE_LOCATIONS[id] = { lat, lng };
  io.emit("allLocations", AMBULANCE_LOCATIONS);
  res.status(200).send();
});

const simulateMoving = () => {
  setInterval(() => {
    Object.keys(AMBULANCE_LOCATIONS).map(index => {
      const location = AMBULANCE_LOCATIONS[index];
      AMBULANCE_LOCATIONS[index] = {
        lat: location.lat + Math.random() / 5000,
        lng: location.lng + Math.random() / 5000
      };
    });
    io.emit("allLocations", AMBULANCE_LOCATIONS);
  }, 1000);
};

const runIo = () => {
  io.on("connection", socket => {
    console.log(" connected");
    socket.on("getAllLocations", () => {
      socket.emit("allLocations", AMBULANCE_LOCATIONS);
    });
    simulateMoving();
  });
};

export default app;
