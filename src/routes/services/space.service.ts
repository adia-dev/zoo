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
        try {
            const space = await Space.findById(spaceId);
            return space;
        } catch (error) {
            throw new Error('Failed to fetch space');
        }
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
            const spaces = await Space.find();
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
}

