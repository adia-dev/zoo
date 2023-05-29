import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAnimal } from './animal.model';
import { IStaff } from './staff.model';

export enum AnimalEventType {
    Feeding = 'Feeding',
    MedicalCheckup = 'Medical Checkup',
    Treatment = 'Treatment',
    Birth = 'Birth',
    Transfer = 'Transfer',
    Release = 'Release',
    Other = 'Other',
}

export interface IAnimalLog extends Document {
    animal: Types.ObjectId | IAnimal; // Reference to the Animal model
    eventType: AnimalEventType;
    eventDate?: Date;
    description: string;
    // TODO: maybe change this to be a reference to only a certain type of staff
    staff?: Types.ObjectId[] | IStaff[] | null; // Reference to the Staff model
}

const AnimalLogSchema: Schema = new Schema(
    {
        animal: { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
        eventType: { type: String, enum: Object.values(AnimalEventType), required: true },
        eventDate: { type: Date, required: true, default: Date.now() },
        description: { type: String, required: true },
        staff: [{ type: Schema.Types.ObjectId, ref: 'Staff', default: null }],
    },
    {
        timestamps: true,
        collection: 'animalLogs',
    }
);

export const AnimalLog = mongoose.model<IAnimalLog>('AnimalLog', AnimalLogSchema);
