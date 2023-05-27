import { Request, Response, Router } from 'express';
import { ISpace } from '../models';
import { SpaceService } from '../services';

export class SpaceController {
    private spaceService: SpaceService;

    constructor() {
        this.spaceService = new SpaceService();
    }

    public routes(): Router {
        const router = Router();

        router.get('/', this.getAllSpaces.bind(this));
        router.get('/:id', this.getSpaceById.bind(this));
        router.post('/', this.createSpace.bind(this));
        router.put('/:id', this.updateSpace.bind(this));
        router.delete('/:id', this.deleteSpace.bind(this));
        router.patch('/:id/set-under-maintenance', this.setUnderMaintenance.bind(this));
        router.patch('/:id/end-maintenance', this.endMaintenance.bind(this));

        router.post('/:id/logs', this.createSpaceLog.bind(this));
        router.get('/:id/logs', this.getSpaceLogs.bind(this));

        return router;
    }

    public async getAllSpaces(req: Request, res: Response): Promise<void> {
        try {
            const spaces = await this.spaceService.getAllSpaces();
            res.status(200).json(spaces);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch spaces' });
        }
    }

    public async getSpaceById(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            const space = await this.spaceService.getSpaceById(spaceId);
            if (space) {
                res.status(200).json(space);
            } else {
                res.status(404).json({ error: 'Space not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch space' });
        }
    }

    public async createSpace(req: Request, res: Response): Promise<void> {
        try {
            const spaceData: ISpace = req.body;
            const newSpace = await this.spaceService.createSpace(spaceData);
            res.status(201).json(newSpace);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create space' });
        }
    }

    public async updateSpace(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            const updatedSpaceData: ISpace = req.body;
            const updatedSpace = await this.spaceService.updateSpace(spaceId, updatedSpaceData);
            if (updatedSpace) {
                res.status(200).json(updatedSpace);
            } else {
                res.status(404).json({ error: 'Space not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update space' });
        }
    }

    public async deleteSpace(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            await this.spaceService.deleteSpace(spaceId);
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete space' });
        }
    }

    public async createSpaceLog(req: Request, res: Response): Promise<void> {
        try {
            // Je deteste typescript desfois, C++, Rust, Zig quoicoubeh apagnan
            // const spaceId: Types.ObjectId = (req.params.id as unknown as Types.ObjectId) // <--  ????????? j'ai perdu 1 heure a cause de ca

            const spaceId = req.params.id;

            if (!spaceId) {
                res.status(400).json({ error: 'Space id is required' });
                return;
            }

            const space = await this.spaceService.getSpaceById(spaceId);

            if (space === null) {
                res.status(404).json({ error: 'Space not found' });
                return;
            }

            const logMessage: string = req.body.logMessage;
            const newSpaceLog = await this.spaceService.createSpaceLog(space, logMessage);
            res.status(201).json(newSpaceLog);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create space log' });
        }
    }

    public async getSpaceLogs(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            const spaceLogs = await this.spaceService.getSpaceLogs(spaceId);
            res.status(200).json(spaceLogs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch space logs' });
        }
    }

    public async setUnderMaintenance(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            const expectedEnd: Date = req.body.expectedEnd;
            const reason: string = req.body.reason;
            const updatedSpace = await this.spaceService.setUnderMaintenance(spaceId, expectedEnd, reason);
            if (updatedSpace) {
                res.status(200).json(
                    {
                        message: 'Space is now under maintenance',
                        space: {
                            _id: updatedSpace._id,
                            name: updatedSpace.name,
                            isUnderMaintenance: updatedSpace.isUnderMaintenance,
                            excpectedEnd: updatedSpace.expectedMaintenanceEnd,
                            reason: updatedSpace.maintenanceReason
                        }
                    }
                );
            } else {
                res.status(404).json({ error: 'Space not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update space' });
        }
    }

    public async endMaintenance(req: Request, res: Response): Promise<void> {
        try {
            const spaceId: string = req.params.id;
            const updatedSpace = await this.spaceService.endMaintenance(spaceId);
            if (updatedSpace) {
                res.status(200).json(
                    {
                        message: 'Space is no longer under maintenance',
                        space: {
                            _id: updatedSpace._id,
                            name: updatedSpace.name,
                            isUnderMaintenance: updatedSpace.isUnderMaintenance,
                            excpectedEnd: updatedSpace.expectedMaintenanceEnd,
                            reason: req.body.reason
                        }
                    }
                );
            } else {
                res.status(404).json({ error: 'Space not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update space' });
        }
    }
}
