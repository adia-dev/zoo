import mongoose, { Schema, Document, Types } from 'mongoose';
import { ISpaceLog, SpaceLogType } from './spaceLog.model';

export enum SpaceType {
    Indoor = 'Indoor',
    Outdoor = 'Outdoor',
}

export enum SpaceSize {
    Small = 'S',
    Medium = 'M',
    Large = 'L',
    ExtraLarge = 'XL',
    ExtraExtraLarge = 'XXL',
}

export interface ISpace extends Document {
    name: string;
    description: string;
    images: string[];
    type: SpaceType;
    capacity: number;
    duration: number;
    size: SpaceSize;
    visitDurationInSeconds?: number | null;
    openingHours: {
        start: string;
        end: string;
    };
    isAccessibleForDisabled: boolean;
    isUnderMaintenance: boolean;
    maintenanceStart?: Date;
    expectedMaintenanceEnd?: Date | null;
    maintenanceReason?: ISpaceLog | Types.ObjectId | null;
    spaceLogs: mongoose.Types.ObjectId[];
}

const SpaceSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        images: [{ type: String }],
        type: { type: String, enum: Object.values(SpaceType), required: true },
        capacity: { type: Number, required: true },
        duration: { type: Number, required: true },
        size: { type: String, enum: Object.values(SpaceSize), required: true, default: SpaceSize.Medium },
        visitDurationInSeconds: { type: Number, required: false },
        openingHours: {
            start: { type: String, required: true },
            end: { type: String, required: true },
        },
        isAccessibleForDisabled: { type: Boolean, required: false, default: true },
        isUnderMaintenance: { type: Boolean, required: false, default: false },
        maintenanceStart: { type: Date },
        expectedMaintenanceEnd: { type: Date },
        maintenanceReason: { type: Schema.Types.ObjectId, ref: 'SpaceLog' },
        spaceLogs: [{ type: Schema.Types.ObjectId, ref: 'SpaceLog' }],
    },
    {
        timestamps: true,
        collection: 'spaces',
    }
);

export const Space = mongoose.model<ISpace>('Space', SpaceSchema);