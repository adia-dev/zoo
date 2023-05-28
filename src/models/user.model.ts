import mongoose, { Schema, Document, Mongoose, Types } from 'mongoose';
import { IRole } from './role.model';

export interface IAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface IUser extends Document {
    _id?: Types.ObjectId;
    firstName: string;
    lastName: string;
    email?: string;
    password: string;
    username: string;
    role: IRole | Types.ObjectId;
    bio?: string;
    birthDate?: Date;
    profilePicture?: string;
    location?: string;
    website?: string;
    address?: IAddress;
    // Add more fields as needed
}

const AddressSchema: Schema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
});

const UserSchema: Schema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    bio: { type: String },
    birthDate: { type: Date },
    profilePicture: { type: String },
    location: { type: String },
    website: { type: String },
    address: { type: AddressSchema },
},
    {
        timestamps: true,
        _id: true,
        autoCreate: true,
        versionKey: false,
        collection: 'users',
    });

export const User = mongoose.model<IUser>('User', UserSchema);
