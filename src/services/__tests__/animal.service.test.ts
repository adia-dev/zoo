const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";
import { Animal, IAnimal, AnimalSpecies, AnimalGender, AnimalTreatment, IAnimalLog, AnimalLog, Space, SpaceType, SpaceSize, IStaff, Staff, AnimalEventType } from "../../models";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";

const request = supertest(app);

const SPACE_COUNT = 10;

describe('(v1) Animal Service tests', () => {

    beforeEach(async () => {
        await connectDB();

        const space = {
            name: 'Space',
            description: 'Space 1 description',
            images: ['image.png', 'image2.png'],
            type: SpaceType.Indoor,
            capacity: 100,
            duration: 60,
            size: SpaceSize.Medium,
            visitDurationInSeconds: 60,
            openingHours: {
                start: '09:00',
                end: '18:00',
            },
            isAccessibleForDisabled: true,
            isUnderMaintenance: false,
            spaceLogs: [],
            staff: [],
        };

        const maintenanceSpace = {
            ...space,
            name: 'Maintenance Space',
            isUnderMaintenance: true,
        };

        const spaces = [...Array(SPACE_COUNT)].map((_, i) => {
            return {
                ...space,
                name: `Space ${i}`,
            };
        });

        const staff = [...Array(10)].map((_, i) => {
            return {
                "firstName": "John",
                "lastName": "Doe",
                "birthDate": "1990-01-01",
                "job": {
                    "title": "Caretaker",
                    "schedule": [
                        {
                            "day": "Monday",
                            "startTime": "9:00 AM",
                            "endTime": "5:00 PM"
                        },
                        {
                            "day": "Tuesday",
                            "startTime": "9:00 AM",
                            "endTime": "5:00 PM"
                        },
                        {
                            "day": "Wednesday",
                            "startTime": "9:00 AM",
                            "endTime": "5:00 PM"
                        },
                        {
                            "day": "Thursday",
                            "startTime": "9:00 AM",
                            "endTime": "5:00 PM"
                        },
                        {
                            "day": "Friday",
                            "startTime": "9:00 AM",
                            "endTime": "5:00 PM"
                        }
                    ]
                },
                "yearsOfExperience": 5,
                "email": `john.doe-${i}@example.com`,
                "isAdmin": false
            }
        });

        await Space.insertMany(spaces);
        await Space.create(maintenanceSpace);

        await Staff.insertMany(staff);

        await Animal.deleteMany({});
        await AnimalLog.deleteMany({});


    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('POST /api/v1/animals', () => {
        it('Create an animal (valid data)', async () => {

            const randomSpace = await Space.findOne();

            const animalData: Partial<IAnimal> = {
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: randomSpace!._id,
                joinedOn: new Date(),
                logs: []
            };

            const res = await request.post('/api/v1/animals').send(animalData);

            expect(res.status).toBe(201);
            expect(res.body.name).toBe(animalData.name);
            expect(res.body.species).toBe(animalData.species);
            expect(res.body.age).toBe(animalData.age);
        });

        it('Create an animal (invalid data)', async () => {
            const animalData = {
                name: '',
                species: 'InvalidSpecies',
                age: -1,
                gender: 'InvalidGender',
                description: '',
                treatments: [],
                spaceId: 'InvalidSpaceId',
                joinedOn: new Date(),
                logs: []
            };

            const res = await request.post('/api/v1/animals').send(animalData);

            expect(res.status).toBe(400);
            expect(res.body.error).toBeTruthy();
            expect(res.body.error).toBe('Please provide all required fields');
        });
    });

    describe('GET /api/v1/animals/:id', () => {
        it('Get an animal by ID (existing animal)', async () => {
            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.get(`/api/v1/animals/${animal._id}`);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(animal.name);
            expect(res.body.species).toBe(animal.species);
            expect(res.body.age).toBe(animal.age);
        });

        it('Get an animal by ID (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/animals/${nonExistingAnimalId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('GET /api/v1/animals', () => {
        it('Get list of animals (empty)', async () => {
            const res = await request.get('/api/v1/animals');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(0);
        });

        it('Get list of animals (non-empty)', async () => {
            await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });
            await Animal.create({
                name: 'Nala',
                species: AnimalSpecies.Lion,
                age: 2,
                gender: AnimalGender.Female,
                description: 'A graceful lioness',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.get('/api/v1/animals');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(2);
        });
    });

    describe('PUT /api/v1/animals/:id', () => {
        it('Update an animal (existing animal)', async () => {
            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const updatedAnimalData = {
                name: 'Simba Jr.',
                age: 4,
                description: 'A young and energetic lion'
            };

            const res = await request.put(`/api/v1/animals/${animal._id}`).send(updatedAnimalData);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updatedAnimalData.name);
            expect(res.body.age).toBe(updatedAnimalData.age);
            expect(res.body.description).toBe(updatedAnimalData.description);

        });

        it('Update an animal (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const updatedAnimalData = {
                name: 'Simba Jr.',
                age: 4,
                description: 'A young and energetic lion'
            };

            const res = await request.put(`/api/v1/animals/${nonExistingAnimalId}`).send(updatedAnimalData);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('DELETE /api/v1/animals/:id', () => {
        it('Delete an animal (existing animal)', async () => {
            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.delete(`/api/v1/animals/${animal._id}`);

            expect(res.status).toBe(204);

            const deletedAnimal = await Animal.findById(animal._id);
            expect(deletedAnimal).toBeNull();
        });

        it('Delete an animal (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.delete(`/api/v1/animals/${nonExistingAnimalId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('GET /api/v1/animals/species/:species', () => {
        it('Get animals by species (existing species)', async () => {
            const lion1 = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });
            const lion2 = await Animal.create({
                name: 'Nala',
                species: AnimalSpecies.Lion,
                age: 2,
                gender: AnimalGender.Female,
                description: 'A graceful lioness',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.get(`/api/v1/animals/species/${AnimalSpecies.Lion}`);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toBe(lion1.name);
            expect(res.body[1].name).toBe(lion2.name);
        });

        it('Get animals by species (non-existing species)', async () => {
            const nonExistingSpecies = 'InvalidSpecies';

            const res = await request.get(`/api/v1/animals/species/${nonExistingSpecies}`);

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Invalid animal species', expected: Object.values(AnimalSpecies) });
        });
    });

    describe('GET /api/v1/animals/space/:spaceId', () => {
        it('Get animals by space (existing space)', async () => {
            const spaceId = '60cfd6f874882f2638e066f1'; // Assuming a valid space ID

            const lion1 = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId,
                joinedOn: new Date(),
                logs: []
            });
            const lion2 = await Animal.create({
                name: 'Nala',
                species: AnimalSpecies.Lion,
                age: 2,
                gender: AnimalGender.Female,
                description: 'A graceful lioness',
                treatments: [],
                spaceId,
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.get(`/api/v1/animals/space/${spaceId}`);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toBe(lion1.name);
        });
    });

    describe('POST /api/v1/animals/:id/treatments', () => {
        it('Perform treatment on an animal (existing animal)', async () => {
            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const treatment: AnimalTreatment = {
                date: new Date(),
                description: 'Administered medication',
                performedBy: '60cfd6f874882f2638e066f1' // Assuming a valid veterinarian ID
            };

            const res = await request.post(`/api/v1/animals/${animal._id}/treatments`).send(treatment);

            expect(res.status).toBe(200);
            expect(res.body.treatments).toEqual([[treatment].map((t) => { return { ...t, _id: expect.any(String), date: t.date.toISOString() } })[0]]);
        });

        it('Perform treatment on an animal (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const treatment: AnimalTreatment = {
                date: new Date(),
                description: 'Administered medication',
                performedBy: '60cfd6f874882f2638e066f1' // Assuming a valid veterinarian ID
            };

            const res = await request.post(`/api/v1/animals/${nonExistingAnimalId}/treatments`).send(treatment);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('GET /api/v1/animals/:id/treatments', () => {
        it('Get treatments of an animal (existing animal)', async () => {
            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [
                    {
                        date: new Date(),
                        description: 'Administered medication',
                        performedBy: '60cfd6f874882f2638e066f1' // Assuming a valid veterinarian ID
                    }
                ],
                spaceId: '60cfd6f874882f2638e066f1', // Assuming a valid space ID
                joinedOn: new Date(),
                logs: []
            });

            const res = await request.get(`/api/v1/animals/${animal._id}/treatments`);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
        });

        it('Get treatments of an animal (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/animals/${nonExistingAnimalId}/treatments`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('POST /api/v1/animals/:id/logs', () => {
        it('Create animal log (existing animal)', async () => {

            const randomStaff = await Staff.findOne();
            const randomSpace = await Space.findOne();

            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: randomSpace!._id,
                joinedOn: new Date(),
                logs: []
            });

            const logData = {
                description: 'Fed the lion',
                staff: randomStaff!._id,
                eventType: AnimalEventType.Feeding
            };

            const res = await request.post(`/api/v1/animals/${animal._id}/logs`).send(logData);

            expect(res.status).toBe(201);
        });

        it('Create animal log (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database
            const randomStaff = await Staff.findOne();

            const logData = {
                description: 'Fed the lion',
                staff: randomStaff!._id
            };

            const res = await request.post(`/api/v1/animals/${nonExistingAnimalId}/logs`).send(logData);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    describe('GET /api/v1/animals/:id/logs', () => {
        it('Get animal logs (existing animal)', async () => {

            const randomStaff = await Staff.findOne();
            const randomSpace = await Space.findOne();

            const animal = await Animal.create({
                name: 'Simba',
                species: AnimalSpecies.Lion,
                age: 3,
                gender: AnimalGender.Male,
                description: 'A majestic lion',
                treatments: [],
                spaceId: randomSpace!._id,
                joinedOn: new Date(),
                logs: []
            });

            const logData = {
                animal: animal._id,
                description: 'Fed the lion',
                staff: randomStaff!._id,
                eventType: AnimalEventType.Feeding
            };

            const animalLog = await AnimalLog.create(logData);

            animal.logs.push(animalLog._id);
            await animal.save();

            const res = await request.get(`/api/v1/animals/${animal._id}/logs`);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(1);
        });

        it('Get animal logs (non-existing animal)', async () => {
            const nonExistingAnimalId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/animals/${nonExistingAnimalId}/logs`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Animal not found' });
        });
    });

    // Add more tests for other endpoints

});
