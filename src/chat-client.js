const express = require('express');
import {chat_config} from './config';

const bodyParser = require("body-parser");
const chat_server = express();
chat_server.use(bodyParser.urlencoded({extended: false}));
chat_server.use(bodyParser.json());
const PORT = chat_config.chat_client_port;
const chat_library = require("./chat-api/chat_library");
require("./chat-api/chat_controller")(chat_server);
// global.__root = __dirname + '/';

// chat_server.use(function (req, res, next) {
// // Website you wish to allow to connect
// //     res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
// // Request methods you wish to allow res.setHeader( "Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE" );
// //
// // Request headers you wish to allow res.setHeader( "Access-Control-Allow-Headers", "X-Requested-With,content-type", "Content-Type" );
// // Set to true if you need the website to include cookies in the requests sent // to the API (e.g. in case you use sessions)
//     res.setHeader("Access-Control-Allow-Credentials", true);
// // Pass to next layer of middleware next();
// });
chat_server.listen(PORT, () => {
    chat_library.login().then(result => {
        if (result) {
            console.log('Connect chat client successful!')
        }
    }).catch(err => {
        console.log('Connect chat client fail!', err);
    })
    console.log(`Server running at: http://localhost:${PORT}/`);
});
