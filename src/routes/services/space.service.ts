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
            await Space.findByIdAndDelete(spaceId);
        } catch (error) {
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

    public async createSpaceLog(spaceId: ISpace | Types.ObjectId, logMessage: string, type?: SpaceLogType): Promise<ISpaceLog> {
        try {
            const spaceLog: Partial<ISpaceLog> = {
                spaceId,
                logMessage,
                logDate: new Date(),
                type: type || SpaceLogType.Info,
            };
            const newSpaceLog = await SpaceLog.create(spaceLog);
            return newSpaceLog;
        } catch (error) {
            console.log(error);
            throw new Error('Failed to create space log');
        }
    }

    public async getSpaceLogs(spaceId: string): Promise<ISpaceLog[]> {
        try {
            const spaceLogs = await SpaceLog.find({ spaceId });
            return spaceLogs;
        } catch (error) {
            throw new Error('Failed to fetch space logs');
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
                        maintenanceLog = await this.createSpaceLog(space, log.logMessage, log.type || SpaceLogType.Maintenance);
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
                        maintenanceLog = await this.createSpaceLog(space, log.logMessage, log.type || SpaceLogType.Maintenance);
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

