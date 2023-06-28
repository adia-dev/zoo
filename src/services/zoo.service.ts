import { type } from 'os';
import { RedisClient } from '../config';
import { Staff, JobTitle } from '../models';
import { createClient } from 'redis';



type StaffRequirement = {
    role: string;
    count: number;
};

type ZooState = {
    opened: boolean;
    openedAt: Date | string;
    closedAt: Date | string;
    entryCount: number;
    exitCount: number;
    staffRequirements: StaffRequirement[];
    canOpen: boolean;
};


export class ZooService {
    private redisClient: RedisClient;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public async getStaffRequirements(): Promise<StaffRequirement[]> {
        try {
            const requiredRoles = ['Receptionist', 'Caretaker', 'Cleaner', 'Vendor'];
            const staffRequirements = await Promise.all(
                requiredRoles.map(async (role) => {
                    const count = await Staff.countDocuments({ 'job.title': role });
                    return { role, count };
                })
            );

            return staffRequirements;
        } catch (error) {
            throw new Error('Failed to get staff requirements');
        }
    }

    public async canZooOpen(): Promise<{ canOpen: boolean; missing?: JobTitle[] }> {
        try {
            const requiredRoles = ['Receptionist', 'Caretaker', 'Cleaner', 'Vendor'];
            const staffCounts = await Promise.all(
                requiredRoles.map(async (role) => {
                    const count = await Staff.countDocuments({ 'job.title': role });
                    return count;
                })
            );

            const [receptionistCount, caretakerCount, cleanerCount, vendorCount] = staffCounts;

            const canOpen = receptionistCount >= 1 && caretakerCount >= 1 && cleanerCount >= 1 && vendorCount >= 1;
            let missing: JobTitle[] = [];

            if (!canOpen) {
                if (receptionistCount < 1) {
                    missing.push(JobTitle.Receptionist);
                }
                if (caretakerCount < 1) {
                    missing.push(JobTitle.Caretaker);
                }
                if (cleanerCount < 1) {
                    missing.push(JobTitle.Cleaner);
                }
                if (vendorCount < 1) {
                    missing.push(JobTitle.Vendor);
                }
            }

            return { canOpen, missing };
        } catch (error) {
            throw new Error('Failed to check if the zoo can open');
        }
    }

    public async isOpened(): Promise<boolean> {
        try {
            const { opened } = await this.getZooState();
            return opened;
        } catch (error) {
            throw new Error('Failed to check if the zoo is opened');
        }
    }

    public async isClosed(): Promise<boolean> {
        try {
            const { opened } = await this.getZooState();
            return !opened;
        } catch (error) {
            throw new Error('Failed to check if the zoo is closed');
        }
    }

    public async openZoo(): Promise<void> {
        try {
            if (await this.isOpened()) {
                throw new Error('Zoo is already open');
            } else if (!await this.canZooOpen()) {
                throw new Error('Zoo cannot open, please check staff requirements');
            }

            await this.setZooOpenState(true);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to check if the zoo is already open');
        }
    }

    public async closeZoo(): Promise<void> {
        try {
            if (await this.isClosed()) {
                throw new Error('Zoo is already closed');
            }
            else if (await this.getEntryCount() > await this.getExitCount()) {
                throw new Error('Zoo cannot close, there are still visitors inside');
            }

            await this.setZooOpenState(false);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to check if the zoo is already closed');
        }
    }

    public async setZooOpenState(opened: boolean): Promise<void> {
        try {
            let state: string;
            if (opened) {
                state = 'open';
                await this.redisClient.set('openedAt', new Date().toISOString());
                await this.redisClient.set('closedAt', '');
                await this.redisClient.set('entryCount', 0);
                await this.redisClient.set('exitCount', 0);
            } else {
                state = 'closed';
                await this.redisClient.set('closedAt', new Date().toISOString());
            }
            this.redisClient.set('zooState', state);
        } catch (error) {
            throw new Error('Failed to set zoo state');
        }
    }

    public async getZooState(): Promise<ZooState> {
        try {
            const zooState: ZooState = {
                opened: await this.redisClient.get('zooState') === 'open',
                openedAt: await this.redisClient.get('openedAt') || 'Not yet opened',
                closedAt: await this.redisClient.get('closedAt') || 'Not yet closed',
                entryCount: await this.getEntryCount(),
                exitCount: await this.getExitCount(),
                staffRequirements: await this.getStaffRequirements(),
                canOpen: (await this.canZooOpen()).canOpen
            };

            return zooState;
        } catch (error) {
            throw new Error('Failed to get zoo state');
        }
    }


    public async incrementEntryCount(): Promise<number> {
        try {
            return await this.redisClient.incr('entryCount');
        } catch (error) {
            throw new Error('Failed to increment entry count');
        }
    }

    public async getEntryCount(): Promise<number> {
        try {
            const count = await this.redisClient.get('entryCount');
            return count ? parseInt(count) : 0;
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }

    public async incrementExitCount(): Promise<number> {
        try {
            return await this.redisClient.incr('exitCount');
        } catch (error) {
            throw new Error('Failed to increment exit count');
        }
    }

    public async getExitCount(): Promise<number> {
        try {
            const count = await this.redisClient.get('exitCount');
            return count ? parseInt(count) : 0;
        } catch (error) {
            throw new Error('Failed to get exit count');
        }
    }

    // You can implement other methods related to the zoo state and data management using Redis here
}
