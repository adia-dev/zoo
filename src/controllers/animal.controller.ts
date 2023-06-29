import { Request, Response, Router } from 'express';
import { AnimalService } from '../services';
import { IAnimal, AnimalSpecies, AnimalTreatment } from '../models';

export class AnimalController {
    private animalService: AnimalService;

    constructor() {
        this.animalService = new AnimalService();
    }

    public routes(): Router {
        const router = Router();

        router.get('/', this.getAllAnimals);
        router.post('/', this.createAnimal);
        router.get('/:id', this.getAnimalById);
        router.put('/:id', this.updateAnimal);
        router.delete('/:id', this.deleteAnimal);
        router.get('/species/:species', this.getAnimalsBySpecies);
        router.get('/space/:spaceId', this.getAnimalsBySpace);
        router.post('/:id/treatments', this.performTreatment);
        router.get('/:id/treatments', this.getTreatmentsByAnimal);
        router.post('/:id/logs', this.createAnimalLog);
        router.get('/:id/logs', this.getAnimalLogs);

        return router;
    }

    public createAnimal = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalData: IAnimal = req.body;

            const missingFields = this.validateAnimal(animalData);

            if (missingFields !== null) {
                res.status(400).json({ error: "Please provide all required fields", missingFields });
                return;
            }

            const newAnimal = await this.animalService.createAnimal(animalData);
            res.status(201).json(newAnimal);
        } catch (error) {
            if(error instanceof Error) {
                res.status(400).json({error: error.message});
                return;
            }
            res.status(500).json({ error: 'Failed to create animal' });
        }
    };

    public getAnimalById = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const animal = await this.animalService.getAnimalById(animalId);
            if (animal) {
                res.json(animal);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch animal' });
        }
    };

    public getAllAnimals = async (_req: Request, res: Response): Promise<void> => {
        try {
            const animals = await this.animalService.getAllAnimals();
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch animals' });
        }
    };

    public updateAnimal = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const updatedData: Partial<IAnimal> = req.body;
            const updatedAnimal = await this.animalService.updateAnimal(animalId, updatedData);
            if (updatedAnimal) {
                res.json(updatedAnimal);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update animal' });
        }
    };

    public deleteAnimal = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            await this.animalService.deleteAnimal(animalId);
            res.sendStatus(204);
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete animal' });
        }
    };

    public getAnimalsBySpecies = async (req: Request, res: Response): Promise<void> => {
        try {
            const species: string = req.params.species;
            if (!species) {
                res.status(400).json({ error: 'Animal species not provided' });
                return;
            }

            if (Object.values(AnimalSpecies).indexOf(species as AnimalSpecies) === -1) {
                res.status(400).json({ error: 'Invalid animal species', expected: Object.values(AnimalSpecies) });
                return;
            }

            const animals = await this.animalService.getAnimalsBySpecies(species as AnimalSpecies);
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch animals' });
        }
    };

    public getAnimalsBySpace = async (req: Request, res: Response): Promise<void> => {
        try {
            const spaceId: string = req.params.spaceId;
            if (!spaceId) {
                res.status(400).json({ error: 'Space ID not provided' });
                return;
            }

            const space = await this.animalService.getAnimalsBySpace(spaceId);
            if (!space) {
                res.status(404).json({ error: 'Space not found' });
                return;
            }

            const animals = await this.animalService.getAnimalsBySpace(spaceId);
            res.json(animals);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch animals' });
        }
    };

    public performTreatment = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const treatment: AnimalTreatment = req.body;
            const updatedAnimal = await this.animalService.performTreatment(animalId, treatment);
            if (updatedAnimal) {
                res.json(updatedAnimal);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to perform treatment' });
        }
    };

    public getTreatmentsByAnimal = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const treatments = await this.animalService.getTreatmentsByAnimal(animalId);
            if (treatments) {
                res.json(treatments);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to fetch treatments' });
        }
    }

    public createAnimalLog = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const logData = req.body;
            const newLog = await this.animalService.createAnimalLog(animalId, logData);
            if (newLog) {
                res.status(201).json(newLog);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to create log' });
        }
    }

    public getAnimalLogs = async (req: Request, res: Response): Promise<void> => {
        try {
            const animalId: string = req.params.id;
            const logs = await this.animalService.getAnimalLogs(animalId);
            if (logs) {
                res.json(logs);
            } else {
                res.status(404).json({ error: 'Animal not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to fetch logs' });
        }
    }

    private validateAnimal(animalData: { [key: string]: any }): any | null {
        const missingFields: { [key: string]: { [key: string]: string } | string } = {};
        const requiredFields: { [key: string]: string } = {
            name: 'string',
            species: 'string',
            age: 'number',
            gender: 'string',
            description: 'string',
            spaceId: 'string',
            joinedOn: 'string',
        };

        const treatmentRequiredFields: { [key: string]: string } = {
            date: 'string',
            description: 'string',
            performedBy: 'string',
        };

        for (const field in requiredFields) {
            if (!animalData[field]) {
                Object.assign(missingFields, { [field]: `${field} is required` });
            } else if (typeof animalData[field] !== requiredFields[field]) {
                Object.assign(missingFields, { [field]: `${field} must be of type ${requiredFields[field]}` });
            }
        }

        if (animalData.treatments?.length > 0) {

            for (const field in treatmentRequiredFields) {
                if (!animalData.treatments[field]) {
                    if (!missingFields['treatments']) {
                        missingFields['treatments'] = {};
                    }
                    Object.assign(missingFields['treatments'], { [field]: `${field} is required` });
                } else if (typeof animalData.treatments[field] !== treatmentRequiredFields[field]) {
                    if (!missingFields['treatments']) {
                        missingFields['treatments'] = {};
                    }
                    Object.assign(missingFields['treatments'], { [field]: `${field} must be of type ${treatmentRequiredFields[field]}` });
                }
            }
        }

        return Object.keys(missingFields).length > 0 ? missingFields : null;
    }

}
