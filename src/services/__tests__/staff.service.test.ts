// @ts-nocheck

const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";
import { JobTitle, NINE_TO_FIVE, EIGHT_TO_FOUR, Staff, IStaff, JobSchedule } from "../../models/";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";

const request = supertest(app);

describe('(v1) Staff Service tests', () => {
    beforeEach(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('POST /api/v1/staff', () => {
        it('Create staff (valid data)', async () => {
            const staffData = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: new Date('1990-01-01'),
                job: {
                    title: JobTitle.Keeper,
                    schedule: NINE_TO_FIVE,
                },
                yearsOfExperience: 5,
                email: 'john.doe@example.com',
                isAdmin: false,
                assignedSpace: null,
            };

            const res = await request.post('/api/v1/staff').send(staffData);

            expect(res.status).toBe(201);
            expect(res.body.firstName).toBe(staffData.firstName);
            expect(res.body.lastName).toBe(staffData.lastName);
            expect(res.body.birthDate).toBe(staffData.birthDate.toISOString());
            expect(res.body.job.title).toBe(staffData.job.title);
            expect(res.body.job.schedule).toEqual(expect.arrayContaining(staffData.job.schedule.map((schedule: JobSchedule) => { return { ...schedule, _id: expect.any(String) } })));
            expect(res.body.yearsOfExperience).toBe(staffData.yearsOfExperience);
            expect(res.body.email).toBe(staffData.email);
            expect(res.body.isAdmin).toBe(staffData.isAdmin);
            expect(res.body.assignedSpace).toBe(staffData.assignedSpace);
        });

        // Add more tests for invalid data, missing required fields, etc.
    });

    describe('GET /api/v1/staff/:id', () => {
        it('Get staff by ID (existing staff)', async () => {
            const staffData = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: new Date('1990-01-01'),
                job: {
                    title: JobTitle.Keeper,
                    schedule: NINE_TO_FIVE,
                },
                yearsOfExperience: 5,
                email: 'john.doe@example.com',
                isAdmin: false,
                assignedSpace: null,
            };

            const createdStaff = await Staff.create(staffData);

            const res = await request.get(`/api/v1/staff/${createdStaff._id}`);

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe(staffData.firstName);
            expect(res.body.lastName).toBe(staffData.lastName);
            expect(res.body.birthDate).toBe(staffData.birthDate.toISOString());
            expect(res.body.job.title).toBe(staffData.job.title);
            expect(res.body.job.schedule).toEqual(expect.arrayContaining(staffData.job.schedule.map((schedule: JobSchedule) => { return { ...schedule, _id: expect.any(String) } })));
            expect(res.body.yearsOfExperience).toBe(staffData.yearsOfExperience);
            expect(res.body.email).toBe(staffData.email);
            expect(res.body.isAdmin).toBe(staffData.isAdmin);
            expect(res.body.assignedSpace).toBe(staffData.assignedSpace);
        });

        it('Get staff by ID (non-existing staff)', async () => {
            const nonExistingStaffId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/staff/${nonExistingStaffId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Staff not found' });
        });
    });

    describe('GET /api/v1/staff', () => {
        it('Get all staff', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].firstName).toBe(staffData[0].firstName);
            expect(res.body[0].lastName).toBe(staffData[0].lastName);
            expect(res.body[1].firstName).toBe(staffData[1].firstName);
            expect(res.body[1].lastName).toBe(staffData[1].lastName);
            // Add more assertions as needed
        });

        // Add more tests for query parameters, filtering, etc.
        it('Get all staff by job title', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?title=Keeper');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("John");
            expect(res.body[0].lastName).toBe("Doe");
        });

        // Add more tests for query parameters, filtering, etc.
        it('Get all staff by schedule (works on Mondays)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?day=Monday');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("John");
            expect(res.body[0].lastName).toBe("Doe");
        });

        it('Get all staff by schedule (works on Saturdays)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?day=Saturday');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("Jane");
            expect(res.body[0].lastName).toBe("Smith");
        });


        it('Get all staff by schedule (works on Saturdays)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?day=Saturday');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("Jane");
            expect(res.body[0].lastName).toBe("Smith");
        });

        it('Get all staff by schedule (works on Sundays)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?day=Sunday');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(0);
        });


        it('Get all staff by schedule (starts at 8AM)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?startTime=8:00');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("Jane");
            expect(res.body[0].lastName).toBe("Smith");
        });

        it('Get all staff by schedule (starts at 9AM)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?startTime=9:00');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("John");
            expect(res.body[0].lastName).toBe("Doe");
        });

        it('Get all staff by schedule (starts at 8AM end at 4PM and works on Saturdays)', async () => {
            const staffData = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    birthDate: new Date('1990-01-01'),
                    job: {
                        title: JobTitle.Keeper,
                        schedule: NINE_TO_FIVE,
                    },
                    yearsOfExperience: 5,
                    email: 'john.doe@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthDate: new Date('1985-05-05'),
                    job: {
                        title: JobTitle.Caretaker,
                        schedule: EIGHT_TO_FOUR,
                    },
                    yearsOfExperience: 3,
                    email: 'jane.smith@example.com',
                    isAdmin: false,
                    assignedSpace: null,
                },
            ];

            await Staff.create(staffData);

            const res = await request.get('/api/v1/staff?startTime=8:00&endTime=16:00&day=Saturday');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].firstName).toBe("Jane");
            expect(res.body[0].lastName).toBe("Smith");
        });
    });

    describe('PUT /api/v1/staff/:id', () => {
        it('Update staff (valid data)', async () => {
            const staffData = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: new Date('1990-01-01'),
                job: {
                    title: JobTitle.Keeper,
                    schedule: NINE_TO_FIVE,
                },
                yearsOfExperience: 5,
                email: 'john.doe@example.com',
                isAdmin: false,
                assignedSpace: null,
            };

            const createdStaff = await Staff.create(staffData);

            const updatedData = {
                firstName: 'John Updated',
                lastName: 'Doe Updated',
                yearsOfExperience: 10,
            };

            const res = await request.put(`/api/v1/staff/${createdStaff._id}`).send(updatedData);

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe(updatedData.firstName);
            expect(res.body.lastName).toBe(updatedData.lastName);
            expect(res.body.yearsOfExperience).toBe(updatedData.yearsOfExperience);
            // Add more assertions to validate the updated fields
        });

        it('Update staff (invalid data)', async () => {
            const staffData = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: new Date('1990-01-01'),
                job: {
                    title: JobTitle.Keeper,
                    schedule: NINE_TO_FIVE,
                },
                yearsOfExperience: 5,
                email: 'john.doe@example.com',
                isAdmin: false,
                assignedSpace: null,
            };

            const createdStaff = await Staff.create(staffData);

            const updatedData = {
                firstName: '',
                yearsOfExperience: 'abc',
            };

            const res = await request.put(`/api/v1/staff/${createdStaff._id}`).send(updatedData);

            expect(res.status).toBe(400);
            // Add assertions to validate the error response
        });

        it('Update staff (non-existing staff)', async () => {
            const nonExistingStaffId = '604eb45c6745be7a28be2ff9';

            const updatedData = {
                firstName: 'John Updated',
                lastName: 'Doe Updated',
                yearsOfExperience: 10,
            };

            const res = await request.put(`/api/v1/staff/${nonExistingStaffId}`).send(updatedData);

            expect(res.status).toBe(404);
            // Add assertions to validate the error response
        });
    });

    describe('DELETE /api/v1/staff/:id', () => {
        it('Delete staff (existing staff)', async () => {
            const staffData = {
                firstName: 'John',
                lastName: 'Doe',
                birthDate: new Date('1990-01-01'),
                job: {
                    title: JobTitle.Keeper,
                    schedule: NINE_TO_FIVE,
                },
                yearsOfExperience: 5,
                email: 'john.doe@example.com',
                isAdmin: false,
                assignedSpace: null,
            };

            const createdStaff = await Staff.create(staffData);

            const res = await request.delete(`/api/v1/staff/${createdStaff._id}`);

            expect(res.status).toBe(204);
            // Verify that the staff has been deleted from the database
            const deletedStaff = await Staff.findById(createdStaff._id);
            expect(deletedStaff).toBeNull();
        });

        it('Delete staff (non-existing staff)', async () => {
            const nonExistingStaffId = '604eb45c6745be7a28be2ff9';

            const res = await request.delete(`/api/v1/staff/${nonExistingStaffId}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Staff not found');
        });
    });
});
