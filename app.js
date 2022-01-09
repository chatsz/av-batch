"use strict";

let express = require("express"),
  bodyParser = require("body-parser"),
  moment = require("moment-timezone"),
  config = require("config"),
  //log = require("./common/utils/log")(module),
  fileUpload = require("express-fileupload");

const cors = require("cors");
//let redis = require("async-redis");

//#region redis config
//let redisConfig = config.get("redis");
//global.redisClient = redis.createClient(redisConfig.port, redisConfig.host);
//if (redisConfig.requiredPass) {
//  global.redisClient.auth(redisConfig.pass)
//}
//let client = global.redisClient;
//#endregion

//const rTracer = require('cls-rtracer'); //node v12.17.0

Date.prototype.toJSON = function () {
  return moment(this).format();
};

let port = process.env.PORT || 8443;
let app = express();

let server = app.listen(port, function () {
  // log.info(app.get('env'));
  // log.info("Starting server listening on port %d in %s mode", port, app.settings.env);
  console.log(
    "Starting server listening on port " +
    port +
    " in " +
    app.settings.env +
    " mode"
  );
  console.log("server time is " + new Date());
});

const socketio = require("socket.io")(server);
socketio.set("transports", ["websocket", "polling"]);

let sockets = socketio.of("/socket");

global.sockets = sockets;

app.use(fileUpload());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.static(config.path.dir));

if (process.env.NODE_ENV != "production") {
  app.use(cors());
} else {
  app.use(function (req, res, next) {
    let origin = req.headers.origin;

    let allowIps = config.allow.ip;
    let allowOrigin = allowIps[0];

    if (origin != undefined) {
      for (let i = 0; i < allowIps.length; i++) {
        if (origin == allowIps[i]) {
          allowOrigin = origin;
        }
      }
    }

    res.header("Access-Control-Allow-Origin", allowOrigin); // restrict it to the required domain

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    // Request headers you wish to allow
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Accept, Authorization, Branch"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);
    // Pass to next layer of middleware
    next();
  });
}

//app.use(rTracer.expressMiddleware()); //node v12.17.0

app.use("/api", require("./route"));
app.get("/", function (req, res) {
  res.send("Hello API");
});
