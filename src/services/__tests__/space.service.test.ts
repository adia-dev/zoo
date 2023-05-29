const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";
import { Space, ISpace, SpaceLog, ISpaceLog, SpaceType, SpaceSize, SpaceLogType } from "../../models";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";

const request = supertest(app);

describe('(v1) Space Service tests', () => {
    beforeEach(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('GET /api/v1/spaces', () => {
        it('Get list of spaces (empty)', async () => {
            const res = await request.get('/api/v1/spaces');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(0);
        });

        it('Get list of spaces (non-empty)', async () => {
            const space1 = await Space.create({
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            });
            const space2 = await Space.create({
                name: 'Space B',
                description: 'This is Space B',
                images: ['image3.jpg', 'image4.jpg'],
                type: SpaceType.Outdoor,
                capacity: 200,
                duration: 120,
                size: SpaceSize.Large,
                openingHours: {
                    start: '10:00',
                    end: '20:00',
                },
                isAccessibleForDisabled: false,
                isUnderMaintenance: true,
            });

            const res = await request.get('/api/v1/spaces');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);

            expect(res.body.length).toBe(2);

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: expect.any(String), name: space1.name, description: space1.description }),
                    expect.objectContaining({ _id: expect.any(String), name: space2.name, description: space2.description }),
                ])
            );
        });
    });

    describe('GET /api/v1/spaces/:id', () => {
        it('Get a space by ID (existing space)', async () => {
            const space = await Space.create({
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            });

            const res = await request.get(`/api/v1/spaces/${space._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.objectContaining({ name: space.name, description: space.description }));
        });

        it('Get a space by ID (non-existing space)', async () => {
            const nonExistingSpaceId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/spaces/${nonExistingSpaceId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Space not found' });
        });
    });

    describe('POST /api/v1/spaces', () => {
        it('Create a space (valid data)', async () => {
            const spaceData = {
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            };

            const res = await request.post(`/api/v1/spaces`).send(spaceData);

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject(spaceData);
        });

        it('Create a space (missing required fields)', async () => {
            const spaceData = {
                name: 'Space A',
            };

            const res = await request.post(`/api/v1/spaces`).send(spaceData);

            const expectedError = {
                error: 'Please provide all required fields',
                missingFields: {
                    description: 'description is required',
                    images: 'images is required',
                    type: 'type is required',
                    capacity: 'capacity is required',
                    duration: 'duration is required',
                    size: 'size is required',
                    openingHours: 'openingHours is required',
                },
            };

            expect(res.status).toBe(400);
            expect(res.body).toEqual(expectedError);
        });

        it('Create a space (invalid data types)', async () => {
            const spaceData = {
                name: 123,
                description: 456,
                images: 'image1.jpg',
                type: 'InSpace',
                capacity: '100',
                duration: '60',
                size: 'Medium Rawrrr',
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: 'true',
                isUnderMaintenance: 'false',
            };

            const res = await request.post(`/api/v1/spaces`).send(spaceData);

            const expectedError = {
                error: 'Please provide all required fields',
                missingFields: {
                    name: 'name must be of type string',
                    description: 'description must be of type string',
                    images: 'images must be an array',
                    type: 'type must be one of Indoor,Outdoor',
                    capacity: 'capacity must be of type number',
                    duration: 'duration must be of type number',
                    size: 'size must be one of S,M,L,XL,XXL',
                },
            };

            expect(res.status).toBe(400);
            expect(res.body).toEqual(expectedError);
        });
    });

    describe('PUT /api/v1/spaces/:id', () => {
        it('Update a space (existing space)', async () => {
            const space = await Space.create({
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            });

            const updatedSpaceData = {
                name: 'Updated Space A',
                description: 'This is the updated Space A',
                capacity: 150,
            };

            const res = await request.put(`/api/v1/spaces/${space._id}`).send(updatedSpaceData);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.objectContaining(updatedSpaceData));

            const updatedSpace = await Space.findById(space._id);
            expect(updatedSpace?.name).toBe(updatedSpaceData.name);
            expect(updatedSpace?.description).toBe(updatedSpaceData.description);
            expect(updatedSpace?.capacity).toBe(updatedSpaceData.capacity);
        });

        it('Update a space (non-existing space)', async () => {
            const nonExistingSpaceId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database
            const updatedSpaceData = {
                name: 'Updated Space A',
                description: 'This is the updated Space A',
                capacity: 150,
            };

            const res = await request.put(`/api/v1/spaces/${nonExistingSpaceId}`).send(updatedSpaceData);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Space not found' });
        });
    });

    describe('DELETE /api/v1/spaces/:id', () => {
        it('Delete a space (existing space)', async () => {
            const space = await Space.create({
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            });

            const res = await request.delete(`/api/v1/spaces/${space._id}`);

            expect(res.status).toBe(204);

            const deletedSpace = await Space.findById(space._id);
            expect(deletedSpace).toBeNull();
        });

        it('Delete a space (non-existing space)', async () => {
            const nonExistingSpaceId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.delete(`/api/v1/spaces/${nonExistingSpaceId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Space not found' });
        });
    });

    describe('GET /api/v1/spaces/:id/logs', () => {
        it('Get logs of a space (existing space)', async () => {
            const space = await Space.create({
                name: 'Space A',
                description: 'This is Space A',
                images: ['image1.jpg', 'image2.jpg'],
                type: SpaceType.Indoor,
                capacity: 100,
                duration: 60,
                size: SpaceSize.Medium,
                openingHours: {
                    start: '09:00',
                    end: '18:00',
                },
                isAccessibleForDisabled: true,
                isUnderMaintenance: false,
            });

            const log1 = await SpaceLog.create({
                spaceId: space._id,
                message: 'Space A is now under maintenance',
                type: SpaceLogType.Maintenance
            });

            const log2 = await SpaceLog.create({
                spaceId: space._id,
                message: 'Space A is now open',
                type: SpaceLogType.Maintenance
            });

            expect(log1._id).toBeDefined();
            expect(log2._id).toBeDefined();

            const res = await request.get(`/api/v1/spaces/${space._id}/logs`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).toEqual(expect.objectContaining({ spaceId: space._id.toString(), message: log1.message, type: log1.type }));
            expect(res.body[1]).toEqual(expect.objectContaining({ spaceId: space._id.toString(), message: log2.message, type: log2.type }));
        });

        it('Get logs of a space (non-existing space)', async () => {
            const nonExistingSpaceId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/spaces/${nonExistingSpaceId}/logs`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Space not found' });
        });

        it('Get logs of a space (invalid space ID)', async () => {
            const invalidSpaceId = '123'; // Invalid space ID

            const res = await request.get(`/api/v1/spaces/${invalidSpaceId}/logs`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Cast to ObjectId failed for value \"123\" (type string) at path \"_id\" for model \"Space\"' });
        });
    });
});

