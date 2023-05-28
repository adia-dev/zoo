import mongoose, { Schema, Document, Types } from 'mongoose';
import { ISpace } from './space.model';

enum TicketType {
    DayPass = 'DayPass',
    WeekendPass = 'WeekendPass',
    AnnualPass = 'AnnualPass',
    MonthlyPass = 'MonthlyPass',
    EscapeGame = 'EscapeGame',
}

export interface ITicket extends Document {
    ticketType: TicketType;
    spaces: Types.ObjectId[] | ISpace[]
    escapeGameSpaces: Types.ObjectId[] | ISpace[]
    escapeGameStep: number;
    visitedSpaces: Types.ObjectId[] | ISpace[]
    validFrom: Date;
    validUntil: Date;
    userId: string;
    lastUsedSpaceId: Types.ObjectId | string | null;
    disabled?: boolean;
    kids?: boolean;
    pregnant?: boolean;
    wheelchair?: boolean;
    celebrity?: boolean;
}

const TicketSchema: Schema = new Schema(
    {
        ticketType: { type: String, enum: Object.values(TicketType), required: true },
        spaces: [{ type: Schema.Types.ObjectId, ref: 'Space', required: true, default: [] }],
        escapeGameSpaces: [{ type: Schema.Types.ObjectId, ref: 'Space', default: [] }],
        visitedSpaces: [{ type: Schema.Types.ObjectId, ref: 'Space', default: [] }],
        escapeGameStep: { type: Number, default: 0 },
        validFrom: { type: Date, required: true },
        validUntil: { type: Date, required: true },
        userId: { type: String, required: true },
        lastUsedSpaceId: { type: Schema.Types.ObjectId, ref: 'Space', default: null },
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
