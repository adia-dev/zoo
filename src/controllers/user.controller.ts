import { Request, Response, Router } from 'express';
import { IUser, User, SessionModel } from '../models';
import { UserService } from '../services';
import { checkUserToken } from "../middlewares";
import { SecurityUtils } from '../utils';
export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    routes(): Router {
        const router = Router();

        router.get('/', checkUserToken(["Manager"]), this.getUsers.bind(this));
        router.post('/login', this.login.bind(this));
        router.post('/', this.createUser.bind(this));
        router.get('/me', this.me.bind(this));

        router.get('/:id', this.getUserById.bind(this));
        router.put('/:id', this.updateUser.bind(this));
        router.delete('/:id', this.deleteUser.bind(this));
        router.put('/:id/role', this.updateUserRole.bind(this));

        return router;
    }
    async login(req: Request, res: Response) {
        if (!req.body || typeof req.body.email !== "string" || typeof req.body.password !== "string") {
            res.status(400).end();
            return;
        }

        try {
            const salt = process.env.PASSWORD_SALT;
            const hashedPassword = await SecurityUtils.toSHA512(req.body.password + salt);
            const user = await User.findOne({
                email: req.body.email,
                password: hashedPassword,
            });
            const session = await SessionModel.create({
                user: user,
                expirationDate: Date.now() + 3600 * 1000 * 24,
            });
            res.json({
                token: session._id
            });
        } catch (error) {
            res.status(401).json({ error: 'Failed to login' });
        }
    }

    async me(req: Request, res: Response) {
        res.json(req.user);
    }

    public async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    public async createUser(req: Request, res: Response): Promise<void> {
        try {
            const userData: IUser = req.body;

            const missingFields = this.validateUser(userData);

            if (missingFields !== null) {
                res.status(400).json({ error: "Please provide all required fields", missingFields });
                return;
            }

            const newUser = await this.userService.createUser(userData);
            res.status(201).json(newUser);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }

            res.status(500).json({ error: 'An error occurred while creating user' });
        }
    }

    public async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const userId: string = req.params.id;
            const user = await this.userService.getUserById(userId);
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }

    public async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userId: string = req.params.id;
            const updatedUserData: IUser = req.body;
            const updatedUser = await this.userService.updateUser(userId, updatedUserData);
            if (updatedUser) {
                res.status(200).json(updatedUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    public async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const userId: string = req.params.id;
            await this.userService.deleteUser(userId);
            res.status(204).end();
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    public async upsertUser(req: Request, res: Response): Promise<void> {
        try {
            const userData: IUser = req.body;
            const updatedUser = await this.userService.upsertUser(userData);
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: 'Failed to upsert user' });
        }
    }

    public async updateUserRole(req: Request, res: Response): Promise<void> {
        try {
            const userId: string = req.params.id;
            const { role } = req.body;
            const updatedUser = await this.userService.updateUserRole(userId, role);
            if (updatedUser) {
                res.status(200).json({ id: updatedUser._id, role: updatedUser.role });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }

            res.status(500).json({ error: 'Failed to update user role' });
        }
    }

    private validateUser(userData: { [key: string]: any }): any | null {
        const missingFields: { [key: string]: { [key: string]: string } | string } = {};
        const requiredFields: { [key: string]: string } = {
            firstName: 'string',
            lastName: 'string',
            email: 'string',
            password: 'string',
            role: 'string'
        }
        const addressRequiredFields: { [key: string]: string } = {
            street: 'string',
            city: 'string',
            state: 'string',
            zip: 'string'
        }

        for (const field in requiredFields) {
            if (!userData[field]) {
                Object.assign(missingFields, { [field]: `${field} is required` });
            } else if (typeof userData[field] !== requiredFields[field]) {
                Object.assign(missingFields, { [field]: `${field} must be of type ${requiredFields[field]}` });
            }
        }

        if (!missingFields['password'] && userData.password.length < 8) {
            Object.assign(missingFields, { password: 'password must be at least 8 characters long' });
        }

        if (userData.address) {

            for (const field in addressRequiredFields) {
                if (!userData.address[field]) {
                    if (!missingFields['address']) {
                        missingFields['address'] = {};
                    }
                    Object.assign(missingFields['address'], { [field]: `${field} is required` });
                } else if (typeof userData.address[field] !== addressRequiredFields[field]) {
                    if (!missingFields['address']) {
                        missingFields['address'] = {};
                    }
                    Object.assign(missingFields['address'], { [field]: `${field} must be of type ${addressRequiredFields[field]}` });
                }
            }
        }

        return Object.keys(missingFields).length > 0 ? missingFields : null;
    }

}
