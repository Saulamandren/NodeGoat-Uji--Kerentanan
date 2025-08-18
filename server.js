"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf"); // CSRF protection middleware
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config");

MongoClient.connect(db, (err, db) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    console.log(`Connected to the database`);

    // Adding/ remove HTTP Headers for security
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // Enable session management using express middleware
    app.use(session({
        secret: cookieSecret,
        saveUninitialized: true,
        resave: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Enable cookies only on HTTPS
            httpOnly: true, // Prevent access to cookie via JavaScript
            sameSite: 'strict' // CSRF protection: prevent cross-site cookie sending
        }
    }));

    // CSRF protection middleware
    const csrfProtection = csrf();
    app.use(csrfProtection); // Enable CSRF protection middleware

    // Make CSRF token available in every template
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken(); // Set CSRF token to the template
        next();
    });

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);

    app.use(express.static(`${__dirname}/app/assets`));

    // Initializing marked library
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, db);

    // Template system setup
    swig.setDefaults({
        autoescape: false
    });

    // Insecure HTTP connection (Should be HTTPS in production)
    http.createServer(app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

});
