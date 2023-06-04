import mongoose, {Model, Schema} from "mongoose";
import {IUser} from "./user.model";

const today = new Date();
const sessionSchema = new Schema<ISession>({
    
    user: {
        type: Schema.Types.ObjectId,
        ref: "User", // correspond au nom du model pour la jointure
        required: true
    },
    platform: {
        type: Schema.Types.String
    },
    expirationDate:{
        type:Schema.Types.Date,
        expires: 10
        },
}, {
    versionKey: false,
    collection: "sessions",
    timestamps:true
});

export interface ISession extends Document {
    _id: string; // notre token
    user: string | IUser;
    platform?: string;
    expirationDate?:Date;
}

export const SessionModel: Model<ISession> = mongoose.model("Session", sessionSchema);