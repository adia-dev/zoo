import { Types } from 'mongoose';
import { Space, ISpace, SpaceLogType } from '../models';
import { SpaceLog, ISpaceLog } from '../models';

export class SpaceService {
    public async createSpace(space: ISpace): Promise<ISpace> {
        try {
            const newSpace = await Space.create(space);
            return newSpace;
        } catch (error) {
            throw new Error('Failed to create space');
        }
    }

    public async getSpaceById(spaceId: string): Promise<ISpace | null> {
        return Space.findById(spaceId);
    }

    public async updateSpace(spaceId: string, updatedSpace: ISpace): Promise<ISpace | null> {
        try {
            const space = await Space.findByIdAndUpdate(spaceId, updatedSpace, { new: true });
            return space;
        } catch (error) {
            throw new Error('Failed to update space');
        }
    }

    public async deleteSpace(spaceId: string): Promise<void> {
        try {
            const deletedSpace = await Space.findByIdAndDelete(spaceId);

            if (!deletedSpace) {
                throw new Error('Space not found');
            }

        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete space');
        }
    }

    public async getAllSpaces(): Promise<ISpace[]> {
        try {
            const spaces = await Space.find().populate('spaceLogs');
            return spaces;
        } catch (error) {
            throw new Error('Failed to fetch spaces');
        }
    }

    public async createSpaceLog(spaceId: ISpace | Types.ObjectId, message: string, type?: SpaceLogType): Promise<ISpaceLog> {
        try {
            const spaceLog: Partial<ISpaceLog> = {
                spaceId,
                message,
                type: type || SpaceLogType.Info,
            };
            const newSpaceLog = await SpaceLog.create(spaceLog);
            return newSpaceLog;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create space log');
        }
    }

    public async getSpaceLogs(spaceId: string): Promise<ISpaceLog[]> {
        try {

            const space = await Space.findById(spaceId);
            if (!space) {
                throw new Error('Space not found');
            }

            const spaceLogs = await SpaceLog.find({ spaceId: space._id });
            return spaceLogs;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to fetch space logs');
        }
    }

    public async deleteSpaceLog(spaceLogId: string): Promise<void> {
        try {
            const deletedSpaceLog = await SpaceLog.findByIdAndDelete(spaceLogId);

            if (!deletedSpaceLog) {
                throw new Error('Space log not found');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete space log');
        }
    }


    public async isUnderMaintenance(spaceId: string): Promise<boolean> {
        try {
            const space = await Space.findById(spaceId);
            if (!space) {
                throw new Error('Space not found');
            }
            return space.isUnderMaintenance;
        } catch (error) {
            throw new Error('Failed to fetch space');
        }
    }

    public async setUnderMaintenance(spaceId: string, expectedMaintenanceEnd?: Date, log?: ISpaceLog | string): Promise<ISpace | null> {
        try {
            const space = await Space.findById(spaceId);
            if (!space) {
                throw new Error('Space not found');
            }

            if (space.isUnderMaintenance) {
                throw new Error('Space is already under maintenance');
            }

            // check if log is an object create it or else it is a reference to an existing log
            let maintenanceLog = null;
            if (log) {
                if (typeof log === 'object') {
                    if (log.id !== undefined) {
                        // log is an existing log
                        const existingLog = await SpaceLog.findById(log.id);
                        if (!existingLog) {
                            throw new Error('Log not found');
                        }

                        maintenanceLog = existingLog;
                    } else {
                        maintenanceLog = await this.createSpaceLog(space, log.message, log.type || SpaceLogType.Maintenance);
                    }
                } else if (typeof log === 'string') {
                    maintenanceLog = await SpaceLog.findById(log);
                }
            }

            space.isUnderMaintenance = true;
            space.maintenanceReason = maintenanceLog;
            space.expectedMaintenanceEnd = expectedMaintenanceEnd || null;
            await space.save();
            return space;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to set space under maintenance');
        }
    }

    public async endMaintenance(spaceId: string, log?: ISpaceLog | string): Promise<ISpace | null> {
        try {
            const space = await Space.findById(spaceId);
            if (!space) {
                throw new Error('Space not found');
            }

            if (!space.isUnderMaintenance) {
                throw new Error('Space is not under maintenance');
            }

            // check if log is an object create it or else it is a reference to an existing log
            let maintenanceLog = null;
            if (log) {
                if (typeof log === 'object') {
                    if (log.id !== undefined) {
                        // log is an existing log
                        const existingLog = await SpaceLog.findById(log.id);
                        if (!existingLog) {
                            throw new Error('Log not found');
                        }

                        maintenanceLog = existingLog;
                    } else {
                        maintenanceLog = await this.createSpaceLog(space, log.message, log.type || SpaceLogType.Maintenance);
                    }
                } else if (typeof log === 'string') {
                    maintenanceLog = await SpaceLog.findById(log);
                }
            }

            space.isUnderMaintenance = false;
            space.maintenanceReason = maintenanceLog;
            space.expectedMaintenanceEnd = null;
            await space.save();

            return space;
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to end maintenance');
        }
    }
}

