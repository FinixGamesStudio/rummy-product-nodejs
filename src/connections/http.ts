const http = require("http");
const https = require("https")
const express = require("express");
const deeplink  = require("node-deeplink")
const cors = require('cors');
const fs = require("graceful-fs");
const bodyParser = require("body-parser");
const app = express();
import path from 'path';
import config = require('./config');
import logger = require('../logger');
import router from '../main/routes';
import { NUMERICAL } from '../constants';
import userRouter from '../cms/routes/Unity_api/user'
import morganMiddleware from '../cms/middleware/morgan.middleware';
import { eroorMiddleware } from '../cms/middleware/response_middleware';

let httpserver: any;

const { CRT_FILE, KEY_FILE } = config()

  // parse application/x-www-form-urlencoded
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: false,
      parameterLimit: 1000000,
    })
  );

  //cors
  app.use(
    cors({
      origin: "*",
    })
  );

  app.use(function (req: any, res: any, next: any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

  // parse application/json
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(morganMiddleware);

  app.use((req: any, res: any, next: any) => {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
  });

app.use(express.json());
// app.use("/Rummy",router)


if (
    fs.existsSync(path.join(__dirname, KEY_FILE)) &&
    fs.existsSync(path.join(__dirname, CRT_FILE))
) {
    // creating https secure socket server
    let options = {
        key: fs.readFileSync(path.join(__dirname, KEY_FILE)),
        cert: fs.readFileSync(path.join(__dirname, CRT_FILE)),
    };
    logger.info('creating https app');
    httpserver = https.createServer(options, app);
} else {
    // creating http server
    logger.info('creating http app');
    httpserver = http.createServer(app);
}
app.get(`/test`, (req: object, res: { status: Function }) => {
    res.status(NUMERICAL.TWO_HUNDRED).send({ status: "OKAY...!!!" })
})

app.use('/',userRouter)
app.use(eroorMiddleware);

app.get("/deeplink/:referralCode", (req: any, res: any, next: any) => {
    const { SERVER_URL } = config();
try {
    
    console.log("------>>req.params ::: ", req.params);
    
    const referralCode = req.params.referralCode;
    
    console.log(
      "------>> /deeplink/:referralCode :: referralCode ::: ",
      referralCode
    );
    
    console.log(
      "------>>deeplink : ",
      deeplink,
      `PWFPointRummy://?${referralCode}`
    );
    
    return deeplink({
      fallback: `${SERVER_URL}`,
      android_package_name: "com.indian.rummy.Rummy",
      url: `AllModeRummy://?${referralCode}`,
    })(req, res, next);
    
} catch (error:any) {
  logger.error(" http :: >>>", error);
  return error; 
}
});

export = httpserver;