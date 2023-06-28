import { Request, Response, Router } from 'express';
import { ZooService } from '../services';
import { RedisClient } from '../config/redis';

export class ZooController {
    private zooService: ZooService;

    constructor(redisClient: RedisClient) {
        this.zooService = new ZooService(redisClient);
    }

    routes(): Router {
        const router = Router();

        router.get('/staff-requirements', this.getStaffRequirements.bind(this));
        router.get('/can-open', this.canZooOpen.bind(this));

        // Add more routes for other zoo-related operations

        return router;
    }

    async getStaffRequirements(req: Request, res: Response): Promise<void> {
        try {
            const staffRequirements = await this.zooService.getStaffRequirements();
            res.status(200).json(staffRequirements);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch staff requirements' });
        }
    }

    async canZooOpen(req: Request, res: Response): Promise<void> {
        try {
            const { canOpen, missing } = await this.zooService.canZooOpen();

            if (missing && missing.length > 0) {
                res.status(400).json({ canOpen, reason: `Missing staff with the following roles: ${missing.join(', ')}` });
                return;
            }

            res.status(200).json({ canOpen });
        } catch (error) {
            res.status(500).json({ error: 'Failed to check if the zoo can open' });
        }
    }

    // Add more handler methods for other zoo-related operations
}
