// @ts-nocheck

const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";
import { Role, User, IUser, IRole, RoleTitle } from "../../models";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";

const request = supertest(app);

describe('(v1) User Service tests', () => {
    beforeEach(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('GET /api/v1/users', () => {
        it('Get list of users (empty)', async () => {
            const res = await request.get('/api/v1/users');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(0);
        });

        it('Get list of users (non-empty)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const user1 = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            });
            const user2 = await User.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                password: 'password',
                username: 'janesmith',
                role: role._id,
            });

            const res = await request.get('/api/v1/users');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);

            expect(res.body.length).toBe(2);

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ firstName: user1.firstName, lastName: user1.lastName }),
                    expect.objectContaining({ firstName: user2.firstName, lastName: user2.lastName }),
                ])
            );
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('Get a user by ID (existing user)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            });

            const res = await request.get(`/api/v1/users/${user._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.objectContaining({ firstName: user.firstName, lastName: user.lastName }));
        });

        it('Get a user by ID (non-existing user)', async () => {
            const nonExistingUserId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/users/${nonExistingUserId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });
    });

    describe('POST /api/v1/users', () => {
        it('Create a user (valid data)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const userData: Partial<IUser> = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            };

            const res = await request.post(`/api/v1/users`).send(userData);

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({ ...userData, role: expect.any(String) });
        });

        it('Create a user (missing required fields)', async () => {
            const userData: IUser = {
                firstName: 'John',
                lastName: 'Doe',
                password: 'password',
                username: 'johndoe',
            };

            const res = await request.post(`/api/v1/users`).send(userData);

            const expectedError = {
                error: 'Please provide all required fields',
                missingFields: {
                    email: 'email is required',
                    role: 'role is required',
                }
            }

            expect(res.status).toBe(400);
            expect(res.body).toEqual(expectedError);
        });

        it('Create a user (invalid data types)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const userData: IUser = {
                firstName: 123,
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            };

            const res = await request.post(`/api/v1/users`).send(userData);

            const expectedError = {
                error: 'Please provide all required fields',
                missingFields: {
                    firstName: 'firstName must be of type string',
                }
            }

            expect(res.status).toBe(400);
            expect(res.body).toEqual(expectedError);
        });
    });

    describe('PUT /api/v1/users/:id', () => {
        it('Update a user (existing user)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            });
            const updatedUserData: IUser = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                password: 'newpassword',
                username: 'janedoe',
                role: role._id,
            };

            const res = await request.put(`/api/v1/users/${user._id}`).send(updatedUserData);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ ...updatedUserData, role: expect.any(Object) });
        });

        it('Update a user (non-existing user)', async () => {

            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });

            const nonExistingUserId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database
            const updatedUserData: IUser = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                password: 'newpassword',
                username: 'janedoe',
                role: role._id,
            };

            const res = await request.put(`/api/v1/users/${nonExistingUserId}`).send(updatedUserData);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });
    });

    describe('DELETE /api/v1/users/:id', () => {
        it('Delete a user (existing user)', async () => {
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: role._id,
            });

            const res = await request.delete(`/api/v1/users/${user._id}`);

            expect(res.status).toBe(204);

            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('Delete a user (non-existing user)', async () => {
            const nonExistingUserId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.delete(`/api/v1/users/${nonExistingUserId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });
    });

    describe('PUT /api/v1/users/:id/role', () => {
        it('Update user role (existing user and role)', async () => {
            const userRole = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const adminRole = await Role.create({ name: RoleTitle.Admin, description: 'Administrator role' });
            const user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: userRole._id,
            });

            const res = await request.put(`/api/v1/users/${user._id}/role`).send({ role: adminRole.name });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                id: user._id.toString(), role: {
                    _id: adminRole._id.toString(),
                    name: adminRole.name,
                    description: adminRole.description,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                }
            });

            const updatedUser = await User.findById(user._id).populate('role');
            expect(updatedUser?.role?.name).toBe(adminRole.name);
        });

        it('Update user role (non-existing user)', async () => {
            const nonExistingUserId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database
            const role = await Role.create({ name: RoleTitle.User, description: 'User role' });

            const res = await request.put(`/api/v1/users/${nonExistingUserId}/role`).send({ role: role.name });

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });

        it('Update user role (non-existing role)', async () => {
            const userRole = await Role.create({ name: RoleTitle.User, description: 'User role' });
            const nonExistingRoleName = 'NonExistingRoleName'; // Assuming this role name does not exist in the database
            const user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
                username: 'johndoe',
                role: userRole._id,
            });

            const res = await request.put(`/api/v1/users/${user._id}/role`).send({ role: nonExistingRoleName });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Role not found' });

            const updatedUser = await User.findById(user._id).populate('role');
            expect(updatedUser?.role?.name).toBe(userRole.name);
        });

    });
});
