import { RedisClient } from '../config';
import { Staff, JobTitle } from '../models';
import { createClient } from 'redis';


export class ZooService {
    private redisClient: RedisClient;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public async getStaffRequirements(): Promise<any> {
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

    public async setZooState(opened: boolean): Promise<void> {
        try {
            const state = opened ? 'open' : 'closed';
            this.redisClient.set('zooState', state);
        } catch (error) {
            throw new Error('Failed to set zoo state');
        }
    }

    public async getZooState(): Promise<boolean | null> {
        try {
            const state = await this.redisClient.get('zooState');
            return state === 'open';
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
