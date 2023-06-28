import { RedisClient } from '../config';
import { JobTitle, Staff } from '../models';

type StaffRequirement = {
    role: string;
    count: number;
};

type ZooState = {
    opened: boolean;
    openedAt: Date | string;
    closedAt: Date | string;
    entries: Array<{ ticketId: string; date: Date | string }>;
    exits: Array<{ ticketId: string; date: Date | string }>;
    staffRequirements: StaffRequirement[];
    canOpen: boolean;
};

enum ZooCrowdLevel {
    Light = 'Light',
    Moderate = 'Moderate',
    Average = 'Average',
    Heavy = 'Heavy',
    Full = 'Full',
}

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

            const canOpen =
                receptionistCount >= 1 &&
                caretakerCount >= 1 &&
                cleanerCount >= 1 &&
                vendorCount >= 1;
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
            } else if (!(await this.canZooOpen()).canOpen) {
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
            } else if (await this.getEntriesCount() > await this.getExitsCount()) {
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
                await this.redisClient.set('entries', JSON.stringify([]));
                await this.redisClient.set('exits', JSON.stringify([]));
            } else {
                state = 'closed';
                await this.redisClient.set('closedAt', new Date().toISOString());
            }
            await this.redisClient.set('zooState', state);
        } catch (error) {
            throw new Error('Failed to set zoo state');
        }
    }

    public async getZooState(): Promise<ZooState> {
        try {
            const zooState: ZooState = {
                opened: (await this.redisClient.get('zooState')) === 'open',
                openedAt: await this.redisClient.get('openedAt') || 'Not yet opened',
                closedAt: await this.redisClient.get('closedAt') || 'Not yet closed',
                entries: await this.getEntries(),
                exits: await this.getExits(),
                staffRequirements: await this.getStaffRequirements(),
                canOpen: (await this.canZooOpen()).canOpen,
            };

            return zooState;
        } catch (error) {
            throw new Error('Failed to get zoo state');
        }
    }

    public async incrementEntries(ticketId: string, date: Date): Promise<number> {
        try {
            const entry = { ticketId, date };
            const entries = await this.getEntries();
            entries.push(entry);
            await this.redisClient.set('entries', JSON.stringify(entries));
            return entries.length;
        } catch (error) {
            throw new Error('Failed to increment entry count');
        }
    }

    public async getEntries(): Promise<Array<{ ticketId: string; date: Date | string }>> {
        try {
            const entriesJson = await this.redisClient.get('entries');
            return entriesJson ? JSON.parse(entriesJson) : [];
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }


    public async getEntriesCount(): Promise<number> {
        try {
            const entries = await this.getEntries();
            return entries.length;
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }

    public async incrementExits(ticketId: string, date: Date): Promise<number> {
        try {
            const exit = { ticketId, date };
            const exits = await this.getExits();
            exits.push(exit);
            await this.redisClient.set('exits', JSON.stringify(exits));
            return exits.length;
        } catch (error) {
            throw new Error('Failed to increment exit count');
        }
    }

    public async getExits(): Promise<Array<{ ticketId: string; date: Date | string }>> {
        try {
            const exitsJson = await this.redisClient.get('exits');
            return exitsJson ? JSON.parse(exitsJson) : [];
        } catch (error) {
            throw new Error('Failed to get exit count');
        }
    }

    public async getExitsCount(): Promise<number> {
        try {
            const exits = await this.getExits();
            return exits.length;
        } catch (error) {
            throw new Error('Failed to get exit count');
        }
    }

    public async getCrowdMetrics(): Promise<number> {
        try {
            const entries = await this.getEntries();
            const exits = await this.getExits();
            return entries.length - exits.length;
        } catch (error) {
            throw new Error('Failed to calculate zoo attendance');
        }
    }
}
