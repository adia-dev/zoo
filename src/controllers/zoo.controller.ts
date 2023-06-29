import { Request, Response, Router } from 'express';
import { ZooService } from '../services';
import { RedisClient } from '../config/redis';
import {checkUserToken} from "../middlewares";

export class ZooController {
    private zooService: ZooService;

    constructor(redisClient: RedisClient) {
        this.zooService = new ZooService(redisClient);
    }

    routes(): Router {
        const router = Router();

        router.get('/staff-requirements', this.getStaffRequirements.bind(this));
        router.get('/can-open', this.canZooOpen.bind(this));
        router.get('/is-opened', this.isOpened.bind(this));
        router.get('/is-closed', this.isClosed.bind(this));
        router.get('/zoo-state', this.getZooState.bind(this));
        router.post('/open-zoo', this.openZoo.bind(this));
        router.post('/close-zoo', this.closeZoo.bind(this));
        router.get('/entries-count', this.getEntriesCount.bind(this));
        router.get('/exits-count', this.getExitsCount.bind(this));
        router.get('/open-zoo-night', checkUserToken(["Admin"]), this.openZooNight.bind(this));


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

    async isOpened(req: Request, res: Response): Promise<void> {
        try {
            const opened = await this.zooService.isOpened();
            res.status(200).json({ opened });
        } catch (error) {
            res.status(500).json({ error: 'Failed to check if the zoo is opened' });
        }
    }

    async isClosed(req: Request, res: Response): Promise<void> {
        try {
            const closed = await this.zooService.isClosed();

            res.status(200).json({ closed });
        } catch (error) {
            res.status(500).json({ error: 'Failed to check if the zoo is closed' });
        }
    }

    async getZooState(req: Request, res: Response): Promise<void> {
        try {
            const zooState = await this.zooService.getZooState();
            res.status(200).json({ zooState });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get zoo state' });
        }
    }

    async openZoo(req: Request, res: Response): Promise<void> {
        try {
            if (req.query.force) {
                await this.zooService.setZooOpenState(true);
                res.status(200).json({ message: 'Zoo forcefuly opened successfully' });
                return;
            }

            await this.zooService.openZoo();
            res.status(200).json({ message: 'Zoo opened successfully' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message })
                return;
            }
            res.status(500).json({ error: 'Failed to open the zoo' });
        }
    }

    async openZooNight(req: Request, res: Response): Promise<void> {
        try {
            if (req.query.night) {
                await this.zooService.setZooOpenState(true);
                res.status(200).json({ message: 'Zoo is open for the night' });
                return;
            }

            await this.zooService.openZooNight();
            res.status(200).json({ message: 'Zoo opened successfully for the night' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message })
                return;
            }
            res.status(500).json({ error: 'Failed to open the zoo' });
        }
    }

    async closeZoo(req: Request, res: Response): Promise<void> {
        try {
            if (req.query.force) {
                await this.zooService.setZooOpenState(false);
                res.status(200).json({ message: 'Zoo forcefuly closed successfully' });
                return;
            }

            await this.zooService.closeZoo();

            res.status(200).json({ message: 'Zoo closed successfully' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message })
                return;
            }

            res.status(500).json({ error: 'Failed to close the zoo' });
        }
    }

    async getEntriesCount(req: Request, res: Response): Promise<void> {
        try {
            const entriesCount = (await this.zooService.getEntriesCount()) || 0;
            res.status(200).json({ entriesCount });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get entries count' });
        }
    }

    async getExitsCount(req: Request, res: Response): Promise<void> {
        try {
            const exitsCount = (await this.zooService.getExitsCount) || 0;
            res.status(200).json({ exitsCount });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get exits count' });
        }
    }
}
