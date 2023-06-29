import { RedisClient } from '../config';
import { JobTitle, Staff } from '../models';

type StaffRequirement = {
    role: string;
    count: number;
};

export enum EntryType {
    Entry = 'ENTRY',
    Exit = 'EXIT',
    Entry_NoTicket = 'ENTRY_NOTICKET', // mouais, on vera si on en a besoin
    Exit_NoTicket = 'EXIT_NOTICKET',
}

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

    public async openZooNight(): Promise<void> {
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
            }
            else if (await this.getEntriesCount() > await this.getExitsCount()) {
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
                entries: await this.getEntryByType(EntryType.Entry) || [],
                exits: await this.getEntryByType(EntryType.Exit) || [],
                staffRequirements: await this.getStaffRequirements(),
                canOpen: (await this.canZooOpen()).canOpen,
            };

            return zooState;
        } catch (error) {
            throw new Error('Failed to get zoo state');
        }
    }

    public async addEntryOrExit(ticketId: string, date: Date, type: EntryType): Promise<void> {
        try {
            const key = this.getCurrentKey(type);
            const entryOrExit = { ticketId, date: date.toISOString() };

            if (!await this.redisClient.json.GET(key)) {
                await this.redisClient.json.set(key, '$', [entryOrExit]);
            } else {
                await this.redisClient.json.arrAppend(key, '$', entryOrExit);
            }
        } catch (error) {
            const errorMessage = `Failed to add ${type} for ticket ${ticketId} at ${date.toISOString()}`;
            throw new Error(errorMessage);
        }
    }

    public async getEntriesCount(): Promise<number> {
        try {
            const entries = await this.getEntryByType(EntryType.Entry);
            return entries.length;
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }

    public async getEntriesAt(date: Date): Promise<any> {
        try {
            const key = this.getKey(date, EntryType.Entry);
            const data = await this.redisClient.json.get(key);

            if (!data) {
                return [];
            }

            return data;
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }

    public async getExitsCount(): Promise<number> {
        try {
            const exits = await this.getEntryByType(EntryType.Exit);
            return exits.length;
        } catch (error) {
            throw new Error('Failed to get exit count');
        }
    }

    public async getExitsAt(date: Date): Promise<any> {
        try {
            const key = this.getKey(date, EntryType.Exit);
            const data = await this.redisClient.json.get(key);

            if (!data) {
                return [];
            }

            return data;
        } catch (error) {
            throw new Error('Failed to get exit count');
        }
    }

    public async getEntryByType(type: EntryType): Promise<any> {
        try {
            const key = this.getCurrentKey(type);
            const data = await this.redisClient.json.get(key);
            return data;
        } catch (error) {
            throw new Error('Failed to get entry count');
        }
    }

    public getKey(date: Date, type: EntryType): string {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}:${type}@${date.getHours()}`;
    }

    public getCurrentKey(type: EntryType): string {
        return this.getKey(new Date(), type);
    }
}
