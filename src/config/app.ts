import * as express from "express";
import * as listEndpoints from "express-list-endpoints";
import * as morgan from "morgan";

const startServer: (router: express.Router, callback?: () => void) => express.Application = (router, callback) => {
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(morgan("dev"));

    app.use(express.json());
    app.use(morgan("dev"));

    app.use(router);

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        let endpoints = listEndpoints(app);

        console.table(endpoints);
        if (callback) {
            callback();
        }
    });

    return app;
}

export { startServer };