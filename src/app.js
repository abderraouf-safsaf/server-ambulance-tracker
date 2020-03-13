import http from "http";
import { env, mongo, port, ip, apiRoot } from "./config";
//import mongoose from "./services/mongoose";
import express from "./services/express";
import api from "./api";

const io = require("socket.io")(
  http /*{
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true
    };
    res.writeHead(200, headers);
    res.end();
  }
}*/
);

const app = express(apiRoot, api);
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());

//mongoose.connect(mongo.uri);
//mongoose.Promise = Promise;
io.on("connection", function(socket) {
  console.log("a user connected");
});

setImmediate(() => {
  const s = server.listen(port, ip, () => {
    console.log(
      "Express server listening on http://%s:%d, in %s mode",
      ip,
      port,
      env
    );

    //runIo();
  });
  io.listen(s);
});

const AMBULANCE_LOCATIONS = {
  1: { lng: 123, lat: 456 }
};

const runIo = () => {
  //io.set("origins", "*:*");
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
