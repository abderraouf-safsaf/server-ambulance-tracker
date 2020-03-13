import http from "http";
import { env, mongo, port, ip, apiRoot } from "./config";
//import mongoose from "./services/mongoose";
import express from "./services/express";
import api from "./api";

const io = require("socket.io")(http);

const app = express(apiRoot, api);
const server = http.createServer(app);

//mongoose.connect(mongo.uri);
//mongoose.Promise = Promise;

setImmediate(() => {
  server.listen(port, ip, () => {
    console.log(
      "Express server listening on http://%s:%d, in %s mode",
      ip,
      port,
      env
    );

    runIo();
  });
});

const AMBULANCE_LOCATIONS = {
  1: { lng: 123, lat: 456 }
};

const runIo = () => {
  io.on("connection", socket => {
    console.log("user connected");
    let previousId;
    const safeJoin = currentId => {
      socket.leave(previousId);
      socket.join(currentId);
      previousId = currentId;
    };

    socket.on("getDoc", docId => {
      safeJoin(docId);
      socket.emit("document", documents[docId]);
    });

    socket.on("addDoc", doc => {
      documents[doc.id] = doc;
      safeJoin(doc.id);
      io.emit("documents", Object.keys(documents));
      socket.emit("document", doc);
    });

    socket.on("editDoc", doc => {
      documents[doc.id] = doc;
      socket.to(doc.id).emit("document", doc);
    });

    io.emit("documents", Object.keys(documents));
  });
};

export default app;
