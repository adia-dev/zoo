import { Router } from "express";
import { initClient } from "../../config/redis";
import { AnimalController, RoleController, SpaceController, StaffController, TicketController, UserController, ZooController } from "../../controllers";
import { checkUserToken } from "../../middlewares";

const v1Router = Router();
const redisClient = initClient();

// Create an instance of the StaffController
const userController = new UserController();
const roleController = new RoleController();
const spaceController = new SpaceController();
const ticketController = new TicketController(redisClient);
const staffController = new StaffController();
const animalController = new AnimalController();
const zooController = new ZooController(redisClient);

// Mount the staff routes under the /api/v1 prefix route
v1Router.use("/api/v1/users", userController.routes());
v1Router.use("/api/v1/roles", checkUserToken(["Admin"]), roleController.routes());
v1Router.use("/api/v1/spaces", checkUserToken(["Admin", "Manager"]), spaceController.routes());
v1Router.use("/api/v1/tickets", ticketController.routes());
v1Router.use("/api/v1/staff", checkUserToken(["Admin", "Manager"]), staffController.routes());
v1Router.use("/api/v1/animals", checkUserToken(["Admin", "Manager", "Staff"]), animalController.routes());
v1Router.use("/api/v1/zoo", checkUserToken(["Admin", "Manager", "Director"]), zooController.routes());

export { v1Router };
