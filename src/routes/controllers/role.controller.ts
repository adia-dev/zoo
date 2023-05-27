import { Request, Response, Router } from 'express';
import { RoleService } from '../services';
import { IRole } from '../models';

export class RoleController {
    private roleService: RoleService;

    constructor() {
        this.roleService = new RoleService();
    }

    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await this.roleService.getRoles();
            res.status(200).json(roles);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch roles' });
        }
    }

    public async createRole(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;

            // make sure of the type of the request body and empty fields
            if (!name || !description) {
                res.status(400).json({ error: 'Missing required fields: name and description' });
                return;
            }

            if (typeof name !== 'string' || typeof description !== 'string') {
                res.status(400).json({ error: 'Invalid field types: name and description must be strings' });
                return;
            }

            const newRole: IRole = req.body;
            const createdRole = await this.roleService.createRole(newRole);
            res.status(201).json(createdRole);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }

            res.status(500).json({ error: 'Failed to create role' });
        }
    }

    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const roleId: string = req.params.id;
            const role = await this.roleService.getRoleById(roleId);
            if (role) {
                res.status(200).json(role);
            } else {
                res.status(404).json({ error: 'Role not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch role' });
        }
    }

    public async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const roleId: string = req.params.id;
            const { name, description } = req.body;

            // make sure of the type of the request body and empty fields
            if (!name || !description) {
                res.status(400).json({ error: 'Missing required fields: name and description' });
                return;
            }

            if (typeof name !== 'string' || typeof description !== 'string') {
                res.status(400).json({ error: 'Invalid field types: name and description must be strings' });
                return;
            }

            const updatedRole: IRole = req.body;
            const updatedRoleResult = await this.roleService.updateRole(roleId, updatedRole);
            if (updatedRoleResult) {
                res.status(200).json(updatedRoleResult);
            } else {
                res.status(404).json({ error: 'Role not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update role' });
        }
    }

    public async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const roleId: string = req.params.id;
            await this.roleService.deleteRole(roleId);
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete role' });
        }
    }

    routes(): Router {
        const router = Router();

        router.get('/', this.getRoles.bind(this));
        router.post('/', this.createRole.bind(this));
        router.get('/:id', this.getRoleById.bind(this));
        router.put('/:id', this.updateRole.bind(this));
        router.delete('/:id', this.deleteRole.bind(this));

        return router;
    }
}