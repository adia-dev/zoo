import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAnimalLog } from './animalLog.model';

export enum AnimalSpecies {
    Lion = 'Lion',
    Tiger = 'Tiger',
    Elephant = 'Elephant',
    Giraffe = 'Giraffe',
    Monkey = 'Monkey',
    Penguin = 'Penguin',
}

export enum AnimalGender {
    Male = 'Male',
    Female = 'Female',
}

export interface AnimalTreatment {
    date: Date;
    description: string;
    performedBy: Types.ObjectId | string; // Reference to the veterinarian who performed the treatment
}

export interface IAnimal extends Document {
    name: string;
    species: AnimalSpecies;
    age: number;
    gender: AnimalGender;
    description: string;
    treatments: AnimalTreatment[];
    spaceId: Types.ObjectId | string; // Reference to the space where the animal resides
    joinedOn: Date;
    logs: Types.ObjectId[] | IAnimalLog[]; // References to the AnimalLog model
}

const AnimalSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        species: { type: String, enum: Object.values(AnimalSpecies), required: true },
        age: { type: Number, required: true },
        description: { type: String, required: true },
        gender: { type: String, enum: Object.values(AnimalGender), required: true },
        joinedOn: { type: Date, required: true },
        treatments: [
            {
                date: { type: Date, required: true },
                description: { type: String, required: true },
                performedBy: { type: Schema.Types.ObjectId, ref: 'Staff', required: true }, // Reference to the Staff model for veterinarians
            },
        ],
        spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: true }, // Reference to the Space model for the space where the animal resides
        logs: [{ type: Schema.Types.ObjectId, ref: 'AnimalLog' }], // References to the AnimalLog model
    },
    {
        timestamps: true,
        collection: 'animals',
    }
);

export const Animal = mongoose.model<IAnimal>('Animal', AnimalSchema);
