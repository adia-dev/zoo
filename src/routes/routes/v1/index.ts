import { Router } from "express";
import { AnimalController, RoleController, SpaceController, StaffController, TicketController, UserController } from "../../controllers";

const v1Router = Router();

// Create an instance of the StaffController
const userController = new UserController();
const roleController = new RoleController();
const spaceController = new SpaceController();
const ticketController = new TicketController();
const staffController = new StaffController();
const animalController = new AnimalController();

// Mount the staff routes under the /api/v1 prefix route
v1Router.use("/api/v1/users", userController.routes());
v1Router.use("/api/v1/roles", roleController.routes());
v1Router.use("/api/v1/spaces", spaceController.routes());
v1Router.use("/api/v1/tickets", ticketController.routes());
v1Router.use("/api/v1/staff", staffController.routes());
v1Router.use("/api/v1/animals", animalController.routes());

export { v1Router };
