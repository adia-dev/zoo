import { config } from "dotenv";
config();

import * as mongoose from "mongoose";
import * as express from "express";
import * as morgan from "morgan";
import * as listEndpoints from "express-list-endpoints";
import { v1Router } from "./routes/routes";

// routers
// import v2 from "./routes/v2";

async function main() {
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(morgan("dev"));

    const mongo_uri = process.env.MONGODB_URI;

    if (!mongo_uri) {
        throw new Error("Mongo URI not found, please check your .env file");
    }

    console.log("Connecting to mongo");

    const mongo_connection = await mongoose.connect(mongo_uri, {
        auth: {
            username: process.env.MONGODB_USER,
            password: process.env.MONGODB_PASSWORD,
        },
        authSource: "admin",
    });

    if (!mongo_connection) {
        throw new Error("Mongo connection failed");
    }


    console.log("Mongo connection successful");

    app.use(express.json());
    app.use(morgan("dev"));

    app.use(v1Router);

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        let endpoints = listEndpoints(app);

        console.table(endpoints);
    });
}

main().catch((err) => {
    console.error(err);
});
