import { Router } from "express";
import { RoleController, SpaceController, TicketController, UserController } from "../../controllers";

const v1Router = Router();

// Create an instance of the StaffController
const userController = new UserController();
const roleController = new RoleController();
const spaceController = new SpaceController();
const ticketController = new TicketController();

// Mount the staff routes under the /api/v1 prefix route
v1Router.use("/api/v1/users", userController.routes());
v1Router.use("/api/v1/roles", roleController.routes());
v1Router.use("/api/v1/spaces", spaceController.routes());
v1Router.use("/api/v1/tickets", ticketController.routes());

export { v1Router };
