import { Router } from "express";
import { UserController } from "../../controllers";

const v1Router = Router();

// Create an instance of the StaffController
const userController = new UserController();

// Mount the staff routes under the /api/v1 prefix route
v1Router.use("/api/v1/users", userController.routes());

export { v1Router };
