import { Request, Response, Router } from 'express';
import { StaffService } from '../services/staff.service';
import { IStaff, JobSchedule, JobTitle } from '../models/staff.model';

export class StaffController {
    private staffService: StaffService;

    constructor() {
        this.staffService = new StaffService();
    }

    public routes(): Router {
        const router = Router();

        router.get('/', this.getAllStaff);
        router.post('/', this.createStaff);
        router.get('/:id', this.getStaffById);
        router.put('/:id', this.updateStaff);
        router.delete('/:id', this.deleteStaff);
        router.get('/job-title/:title', this.getStaffByJobTitle);
        router.get('/schedule/:schedule', this.getStaffBySchedule);
        router.put('/:id/assign-space/', this.assignStaffToSpace);
        router.get('/weekly-staff-requirements', this.checkWeeklyStaffRequirements);
        router.post('/:id/check-in', this.checkInStaff);
        router.post('/:id/check-out', this.checkOutStaff);

        return router;
    }

    public createStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffData: IStaff = req.body;
            const newStaff = await this.staffService.createStaff(staffData);
            res.status(201).json(newStaff);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create staff' });
        }
    };

    public getStaffById = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            const staff = await this.staffService.getStaffById(staffId);
            if (staff) {
                res.json(staff);
            } else {
                res.status(404).json({ error: 'Staff not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch staff' });
        }
    };

    public getAllStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staff = await this.staffService.getAllStaff(req.query);
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch staff' });
        }
    };

    public updateStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            const updatedData: Partial<IStaff> = req.body;
            const updatedStaff = await this.staffService.updateStaff(staffId, updatedData);
            if (updatedStaff) {
                res.json(updatedStaff);
            } else {
                res.status(404).json({ error: 'Staff not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update staff' });
        }
    };

    public checkWeeklyStaffRequirements = async (req: Request, res: Response): Promise<void> => {
        try {
            const isRequirementsMet = await this.staffService.checkWeeklyStaffRequirements();

            if (isRequirementsMet) {
                res.json({ message: 'he weekly staff requirements are met.' });
            } else {
                res.status(400).json({ error: 'Some required positions are not filled.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to check weekly staff requirements' });
        }
    };


    public deleteStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            await this.staffService.deleteStaff(staffId);
            res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete staff' });
        }
    };

    public getStaffByJobTitle = async (req: Request, res: Response): Promise<void> => {
        try {
            const jobTitle: string = req.params.title;
            if (!jobTitle) {
                res.status(400).json({ error: 'Job title not provided' });
                return;
            }

            const staff = await this.staffService.getStaffByJobTitle(jobTitle as JobTitle);
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch staff' });
        }
    };

    public getStaffBySchedule = async (req: Request, res: Response): Promise<void> => {
        try {
            const day: string = req.params.schedule;
            const startTime: string = req.query.startTime as string;
            const endTime: string = req.query.endTime as string;

            if (!day && !startTime && !endTime) {
                res.status(400).json({ error: 'Please provide at least one query parameter (day, startTime, endTime)' });
                return;
            }

            const staff = await this.staffService.getStaffBySchedule(day, startTime, endTime);

            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch staff' });
        }
    };





    public assignStaffToSpace = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            const spaceId: string = req.body.spaceId;
            const updatedStaff = await this.staffService.assignStaffToSpace(staffId, spaceId);
            if (updatedStaff) {
                res.json(updatedStaff);
            } else {
                res.status(404).json({ error: 'Staff not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update staff' });
        }
    }

    public checkInStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            const updatedStaff = await this.staffService.checkInStaff(staffId, new Date());
            if (updatedStaff) {
                res.json({ message: `${updatedStaff.firstName} ${updatedStaff.lastName} checked in successfully at ${updatedStaff.checkInTime}` });
            } else {
                res.status(404).json({ error: 'Staff not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update staff' });
        }
    }

    public checkOutStaff = async (req: Request, res: Response): Promise<void> => {
        try {
            const staffId: string = req.params.id;
            const updatedStaff = await this.staffService.checkOutStaff(staffId, new Date());
            if (updatedStaff) {
                res.json({ message: `${updatedStaff.firstName} ${updatedStaff.lastName} checked out successfully at ${updatedStaff.checkOutTime}` });
            } else {
                res.status(404).json({ error: 'Staff not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update staff' });
        }
    }
}
