import { Request, Response, Router } from 'express';
import { IUser } from '../models';
import { UserService } from '../services';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    routes(): Router {
        const router = Router();

        router.get('/', this.getUsers.bind(this));
        router.post('/', this.createUser.bind(this));
        router.get('/:id', this.getUserById.bind(this));
        router.put('/:id', this.updateUser.bind(this));
        router.delete('/:id', this.deleteUser.bind(this));
        router.put('/:id/role', this.updateUserRole.bind(this));

        return router;
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
            const newUser = await this.userService.createUser(userData);
            res.status(201).json(newUser);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
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
                res.status(500).json({ error: error.message });
                return;
            }

            res.status(500).json({ error: 'Failed to update user role' });
        }
    }
}
