import mongoose, { Schema, Document, Types } from 'mongoose';
import { ISpace } from './space.model';

export enum TicketType {
    DayPass = 'DayPass',
    WeekendPass = 'WeekendPass',
    AnnualPass = 'AnnualPass',
    MonthlyPass = 'MonthlyPass',
    EscapeGame = 'EscapeGame',
}

export interface ITicketRecord {
    ticket: Types.ObjectId | ITicket;
    space: Types.ObjectId | ISpace;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITicket extends Document {
    valid: boolean;
    ticketType: TicketType;
    spaces: Types.ObjectId[] | ISpace[]
    escapeGameStep: number;
    visitedSpaces: ITicketRecord[];
    validFrom: Date;
    validUntil: Date;
    userId: string;
    lastVisitedSpace: Types.ObjectId | string | null;
    disabled?: boolean;
    kids?: boolean;
    pregnant?: boolean;
    wheelchair?: boolean;
    celebrity?: boolean;
}

const TicketRecordSchema: Schema = new Schema(
    {
        space: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    },
    {
        _id: true,
        timestamps: true,
    }
);

const TicketSchema: Schema = new Schema(
    {
        valid: { type: Boolean, default: true },
        ticketType: { type: String, enum: Object.values(TicketType), required: true },
        spaces: [{ type: Schema.Types.ObjectId, ref: 'Space', required: true, default: [] }],
        visitedSpaces: [{ type: TicketRecordSchema, default: [] }],
        escapeGameStep: { type: Number, default: 0 },
        validFrom: { type: Date, required: true },
        validUntil: { type: Date, required: true },
        userId: { type: String, required: true },
        records: [{ type: TicketRecordSchema, default: [] }],
        lastVisitedSpace: { type: Schema.Types.ObjectId, ref: 'Space', default: null },
        disabled: { type: Boolean, default: false },
        kids: { type: Boolean, default: false },
        pregnant: { type: Boolean, default: false },
        wheelchair: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        collection: 'tickets',
    }
);

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
