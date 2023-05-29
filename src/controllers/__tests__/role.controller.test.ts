const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";
import { Role, RoleTitle } from "../../models";

const request = supertest(app);

describe('(v1) Role Service tests', () => {
    beforeEach(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('GET /api/v1/roles', () => {
        it('Get list of roles (empty)', async () => {
            const res = await request.get('/api/v1/roles');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(0);
        });

        it('Get list of roles (non-empty)', async () => {
            const role1 = await Role.create({ name: RoleTitle.Admin, description: 'Administrator role' });
            const role2 = await Role.create({ name: RoleTitle.User, description: 'User role' });

            const res = await request.get('/api/v1/roles');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);

            expect(res.body.length).toBe(2);

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: role1.name, description: role1.description }),
                    expect.objectContaining({ name: role2.name, description: role2.description }),
                ])
            );
        });
    });


    describe('GET /api/v1/roles/:id', () => {
        it('Get a role by ID (existing role)', async () => {
            const role = await Role.create({ name: RoleTitle.Admin, description: 'Administrator role' });

            const res = await request.get(`/api/v1/roles/${role._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.objectContaining({ name: role.name, description: role.description }));
        });

        it('Get a role by ID (non-existing role)', async () => {
            const nonExistingRoleId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.get(`/api/v1/roles/${nonExistingRoleId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Role not found' });
        });
    });

    describe('PUT /api/v1/roles/:id', () => {
        it('Update a role (existing role)', async () => {
            const role = await Role.create({ name: RoleTitle.Admin, description: 'Administrator role' });
            const updatedRoleData = { name: 'Manager', description: 'Manager role' };

            const res = await request.put(`/api/v1/roles/${role._id}`).send(updatedRoleData);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.objectContaining(updatedRoleData));
        });

        it('Update a role (non-existing role)', async () => {
            const nonExistingRoleId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database
            const updatedRoleData = { name: 'Manager', description: 'Manager role' };

            const res = await request.put(`/api/v1/roles/${nonExistingRoleId}`).send(updatedRoleData);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Role not found' });
        });

        // Add more tests for validation, empty fields, invalid field types, etc.
    });

    describe('DELETE /api/v1/roles/:id', () => {
        it('Delete a role (existing role)', async () => {
            const role = await Role.create({ name: RoleTitle.Admin, description: 'Administrator role' });

            const res = await request.delete(`/api/v1/roles/${role._id}`);

            expect(res.status).toBe(204);

            const deletedRole = await Role.findById(role._id);
            expect(deletedRole).toBeNull();
        });

        it('Delete a role (non-existing role)', async () => {
            const nonExistingRoleId = '604eb45c6745be7a28be2ff9'; // Assuming this ID does not exist in the database

            const res = await request.delete(`/api/v1/roles/${nonExistingRoleId}`);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'Role not found' });
        });
    });
    // Add more tests for other endpoints (e.g., GET /api/v1/roles/:roleId, PUT /api/v1/roles/:roleId, DELETE /api/v1/roles/:roleId)

    describe('POST /api/v1/roles', () => {
        it('Create a role (valid data)', async () => {
            const roleData = { name: RoleTitle.Admin, description: 'Administrator role' };

            const res = await request.post(`/api/v1/roles`).send(roleData);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(expect.objectContaining(roleData));
        });

        it('Create a role (invalid data)', async () => {
            const roleData = { name: RoleTitle.Admin, description: '' };

            const res = await request.post(`/api/v1/roles`).send(roleData);

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Missing required fields: name and description' });
        });

        it('Create a role (invalid data types)', async () => {
            const roleData = { name: 123, description: 123 };

            const res = await request.post(`/api/v1/roles`).send(roleData);

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Invalid field types: name and description must be strings' });
        });

        it('Create a role that is not in the enum', async () => {
            const roleData = { name: 'Super Admin', description: 'Super Admin role' };

            const res = await request.post(`/api/v1/roles`).send(roleData);

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Role validation failed: name: `Super Admin` is not a valid enum value for path `name`.' });
        });
    }
    );
});
