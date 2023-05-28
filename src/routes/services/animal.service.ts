import { Animal, IAnimal, AnimalSpecies, AnimalGender, AnimalTreatment } from '../models';

export class AnimalService {
    public async createAnimal(animalData: IAnimal): Promise<IAnimal> {
        try {
            const animal = new Animal(animalData);
            const newAnimal = await animal.save();
            return newAnimal;
        } catch (error) {
            throw new Error('Failed to create animal');
        }
    }

    public async getAnimalById(animalId: string): Promise<IAnimal | null> {
        try {
            const animal = await Animal.findById(animalId);
            return animal;
        } catch (error) {
            throw new Error('Failed to fetch animal');
        }
    }

    public async getAllAnimals(): Promise<IAnimal[]> {
        try {
            const animals = await Animal.find();
            return animals;
        } catch (error) {
            throw new Error('Failed to fetch animals');
        }
    }

    public async updateAnimal(animalId: string, updatedData: Partial<IAnimal>): Promise<IAnimal | null> {
        try {
            const animal = await Animal.findByIdAndUpdate(animalId, updatedData, { new: true });
            return animal;
        } catch (error) {
            throw new Error('Failed to update animal');
        }
    }

    public async deleteAnimal(animalId: string): Promise<void> {
        try {
            await Animal.findByIdAndRemove(animalId);
        } catch (error) {
            throw new Error('Failed to delete animal');
        }
    }

    public async getAnimalsBySpecies(species: AnimalSpecies): Promise<IAnimal[]> {
        try {
            const animals = await Animal.find({ species });
            return animals;
        } catch (error) {
            throw new Error('Failed to fetch animals');
        }
    }

    public async getAnimalsBySpace(spaceId: string): Promise<IAnimal[]> {
        try {
            const animals = await Animal.find({ spaceId });
            return animals;
        } catch (error) {
            throw new Error('Failed to fetch animals');
        }
    }

    public async performTreatment(animalId: string, treatment: AnimalTreatment): Promise<IAnimal | null> {
        try {
            const animal = await Animal.findById(animalId);
            if (!animal) {
                throw new Error('Animal not found');
            }
            animal.treatments.push(treatment);
            const updatedAnimal = await animal.save();
            return updatedAnimal;
        } catch (error) {
            throw new Error('Failed to perform treatment');
        }
    }

    public async getTreatmentsByAnimal(animalId: string): Promise<AnimalTreatment[]> {
        try {
            const animal = await Animal.findById(animalId);
            if (!animal) {
                throw new Error('Animal not found');
            }
            return animal.treatments;
        } catch (error) {
            throw new Error('Failed to fetch treatments');
        }
    }
}
