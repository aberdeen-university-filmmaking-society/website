"use strict";
 
require("greenlock-express")
    .create({
        email: process.env.SSL_EMAIL, // The email address of the ACME user / hosting provider
        agreeTos: true, // You must accept the ToS as the host which handles the certs
        configDir: "./acme", // Writable directory where certs will be saved
        communityMember: false, // Join the community to get notified of important updates
        telemetry: false, // Contribute telemetry data to the project
 
        // Using your express app:
        // simply export it as-is, then include it here
        app: require("./app.js")
 
        //, debug: true
    })
    .listen(80, 443);