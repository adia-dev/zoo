import { config } from "dotenv";
config();

import { startServer } from "./config";
import { connectDB } from "./config/mongodb";
import { v1Router } from "./routes";

// routers
// import v2 from "./routes/v2";

async function main() {
    await connectDB();

    startServer(v1Router, () => {
        console.log("Server started");
    });
}

main().catch((err) => {
    console.error(err);
});
