import mongoose, { Schema, Document } from 'mongoose';
import { ISpace } from './space.model';

export enum JobTitle {
    Caretaker = 'Caretaker',
    Keeper = 'Keeper',
    Veterinarian = 'Veterinarian',
    Registrar = 'Registrar',
    Director = 'Director',
    Manager = 'Manager',
}

interface JobSchedule {
    day: string;
    startTime: string;
    endTime: string;
}

interface Job {
    title: JobTitle;
    schedule: JobSchedule[];
}

export interface IStaff extends Document {
    firstName: string;
    lastName: string;
    birthDate?: Date;
    job: Job;
    yearsOfExperience: number;
    salary?: number;
    email: string;
    isAdmin: boolean;
    assignedSpace: ISpace | null;
}

const NINE_TO_FIVE: JobSchedule[] = [
    { day: 'Monday', startTime: '9:00 AM', endTime: '5:00 PM' },
    { day: 'Tuesday', startTime: '9:00 AM', endTime: '5:00 PM' },
    { day: 'Wednesday', startTime: '9:00 AM', endTime: '5:00 PM' },
    { day: 'Thursday', startTime: '9:00 AM', endTime: '5:00 PM' },
    { day: 'Friday', startTime: '9:00 AM', endTime: '5:00 PM' },
];

const EIGHT_TO_FOUR: JobSchedule[] = [
    { day: 'Tuesday', startTime: '8:00 AM', endTime: '4:00 PM' },
    { day: 'Wednesday', startTime: '8:00 AM', endTime: '4:00 PM' },
    { day: 'Thursday', startTime: '8:00 AM', endTime: '4:00 PM' },
    { day: 'Friday', startTime: '8:00 AM', endTime: '4:00 PM' },
    { day: 'Saturday', startTime: '8:00 AM', endTime: '4:00 PM' },
];

const I_DONT_DO_NOTHING_BUT_I_GET_PAID_AKA_ADMINS: JobSchedule[] = [
    { day: 'Monday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Tuesday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Wednesday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Thursday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Friday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Saturday', startTime: '11:00 AM', endTime: '12:00 AM' },
    { day: 'Sunday', startTime: '11:00 AM', endTime: '12:00 AM' },
];

const StaffSchema: Schema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        birthDate: { type: Date },
        job: {
            title: { type: String, enum: Object.values(JobTitle), required: true },
            schedule: [
                {
                    day: { type: String, required: true },
                    startTime: { type: String, required: true },
                    endTime: { type: String, required: true },
                },
            ],
        },
        yearsOfExperience: { type: Number, required: false, default: 0 },
        salary: { type: Number },
        email: { type: String, required: true },
        isAdmin: { type: Boolean, required: true },
        assignedSpace: { type: Schema.Types.ObjectId, ref: 'Space' },
    },
    {
        timestamps: true,
        collection: 'staff',
    }
);

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);

export {
    Job,
    JobSchedule,
    NINE_TO_FIVE,
    EIGHT_TO_FOUR,
    I_DONT_DO_NOTHING_BUT_I_GET_PAID_AKA_ADMINS,
}