import { EIGHT_TO_FOUR, IStaff, I_DONT_DO_NOTHING_BUT_I_GET_PAID_AKA_ADMINS, JobSchedule, JobTitle, NINE_TO_FIVE, Staff } from '../models/staff.model';
import { ISpace, Space } from '../models/space.model';
import {Request, Response} from "express";

export interface IStaffRequestParams {
    day?: string;
    startTime?: string;
    endTime?: string;
    title?: JobTitle;
    firstname?: string;
    lastname?: string;
    email?: string;
}

export class StaffService {
    public async createStaff(staffData: IStaff): Promise<IStaff> {
        try {
            const staff = new Staff(staffData);

            // If the staff member is an admin, they get a special job title and schedule
            if (staff.job.schedule.length === 0) {
                staff.job.schedule = this.getDefaultJobSchedule(staff.job.title);
            }

            staff.isAdmin = staff.job.title === JobTitle.Director || staff.job.title === JobTitle.Manager;

            const newStaff = await staff.save();
            return newStaff;
        } catch (error) {
            throw new Error('Failed to create staff');
        }
    }

    public async checkWeeklyStaffRequirements(): Promise<boolean> {
        try {
            const requiredJobTitles: JobTitle[] = [
                JobTitle.Registrar,
                JobTitle.Veterinarian,
                JobTitle.Caretaker,
                JobTitle.Seller
            ];

            const staffByJobTitle: { [key in JobTitle]?: any[] } = {};

            for (const jobTitle of requiredJobTitles) {
                staffByJobTitle[jobTitle] = await this.getStaffByJobTitle(jobTitle);
            }

            for (const jobTitle of requiredJobTitles) {
                if (staffByJobTitle[jobTitle]?.length === 0) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            throw new Error('Failed to check weekly staff requirements');
        }
    }



    public async getStaffById(staffId: string): Promise<IStaff | null> {
        try {
            const staff = await Staff.findById(staffId);
            return staff;
        } catch (error) {
            throw new Error('Failed to fetch staff');
        }
    }

    public async getAllStaff(params?: IStaffRequestParams): Promise<IStaff[]> {
        try {
            if (params) {
                const filters = this.buildStaffFilters(params);
                const staff = await Staff.find(filters).populate('assignedSpace');
                return staff;
            }
            return await Staff.find().populate('assignedSpace');
        } catch (error) {
            throw new Error('Failed to fetch staff');
        }
    }

    public async updateStaff(staffId: string, updatedData: Partial<IStaff>): Promise<IStaff | null> {
        try {
            const staff = await Staff.findByIdAndUpdate(staffId, updatedData, { new: true });
            return staff;
        } catch (error) {
            throw new Error('Failed to update staff');
        }
    }

    public async deleteStaff(staffId: string): Promise<void> {
        try {
            const deletedStaff = await Staff.findByIdAndRemove(staffId);

            if (!deletedStaff) {
                throw new Error('Staff not found');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }

            throw new Error('Failed to delete staff');
        }
    }

    public async getStaffByJobTitle(jobTitle: JobTitle): Promise<IStaff[]> {
        try {
            const staff = await Staff.find({ 'job.title': jobTitle });
            return staff;
        } catch (error) {
            throw new Error('Failed to fetch staff');
        }
    }

    public async getStaffBySchedule(day: string, startTime: string, endTime: string): Promise<IStaff[]> {
        try {
            const staff = await Staff.find({
                'job.schedule.day': day,
                'job.schedule.startTime': startTime,
                'job.schedule.endTime': endTime,
            });
            return staff;
        } catch (error) {
            throw new Error('Failed to fetch staff');
        }
    }

    public async assignStaffToSpace(staffId: string, spaceId: string): Promise<IStaff | null> {
        try {
            const staff = await Staff.findById(staffId);
            if (!staff) {
                throw new Error('Staff not found');
            }

            if (spaceId) {
                const space = await Space.findById(spaceId);
                if (!space) {
                    throw new Error('Space not found');
                }
                staff.assignedSpace = space;
            } else {
                staff.assignedSpace = null;
            }

            const updatedStaff = await staff.save();
            return updatedStaff;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to assign staff to space');
        }
    }

    private getDefaultJobSchedule(jobTitle: string): JobSchedule[] {
        switch (jobTitle) {
            case JobTitle.Director:
            case JobTitle.Manager:
                return I_DONT_DO_NOTHING_BUT_I_GET_PAID_AKA_ADMINS;
            case JobTitle.Keeper:
            case JobTitle.Caretaker:
                return NINE_TO_FIVE;
            case JobTitle.Registrar:
            case JobTitle.Veterinarian:
                return EIGHT_TO_FOUR;
            default:
                return NINE_TO_FIVE;
        }
    }

    private buildStaffFilters(params: IStaffRequestParams): any {
        const filters: { [key: string]: string } = {};
        if (params.day) {
            filters['job.schedule.day'] = params.day;
        }
        if (params.startTime) {
            // convert 24 hour time to 12 hour time
            const [hour, minute] = params.startTime.split(':');
            const startTime = `${parseInt(hour) % 12}:${minute} ${parseInt(hour) < 12 ? 'AM' : 'PM'}`;
            filters['job.schedule.startTime'] = startTime;
        }
        if (params.endTime) {
            // convert 24 hour time to 12 hour time
            const [hour, minute] = params.endTime.split(':');
            const endTime = `${parseInt(hour) % 12}:${minute} ${parseInt(hour) < 12 ? 'AM' : 'PM'}`;
            filters['job.schedule.endTime'] = endTime;
        }
        if (params.title) {
            filters['job.title'] = params.title;
        }
        if (params.firstname) {
            filters['firstName'] = params.firstname;
        }
        if (params.lastname) {
            filters['lastName'] = params.lastname;
        }
        if (params.email) {
            filters['email'] = params.email;
        }
        return filters;
    }
}
