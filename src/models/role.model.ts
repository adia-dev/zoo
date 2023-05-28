import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRole extends Document {
    _id?: Types.ObjectId;
    name: string;
    description: string;
}

const RoleSchema: Schema = new Schema({
    name: {
        type: String, required: true, unique: true,
        enum: ['Admin', 'User', 'Manager', 'Guest']
    },
    description: { type: String, required: true },
}, {
    timestamps: true,
    _id: true,
    autoCreate: true,
    versionKey: false,
    collection: 'roles',
});

export const Role = mongoose.model<IRole>('Role', RoleSchema);
