import mongoose, { Schema, Document } from 'mongoose';
import { ISpace } from './space.model';

export enum SpaceLogType {
    Info = 'Info',
    Accident = 'Accident',
    Maintenance = 'Maintenance',
    Animal = 'Animal',
    Other = 'Other',
}

export interface ISpaceLog extends Document {
    spaceId: ISpace | mongoose.Types.ObjectId;
    logMessage: string;
    logDate: Date;
    type: SpaceLogType;
}

const SpaceLogSchema: Schema = new Schema(
    {
        spaceId: { type: mongoose.Types.ObjectId, required: true },
        logMessage: { type: String, required: true },
        logDate: { type: Date, required: true },
        type: { type: String, enum: Object.values(SpaceLogType), required: true },
    },
    {
        timestamps: true,
        collection: 'spaceLogs',
    }
);

export const SpaceLog = mongoose.model<ISpaceLog>('SpaceLog', SpaceLogSchema);
