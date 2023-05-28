const supertest = require('supertest');
import { startServer } from "../../config";
import { v1Router } from "../../routes";

const { app, server } = startServer(v1Router);
import { connectDB, disconnectDB } from "../../config";

const request = supertest(app);

describe('API test', () => {
    beforeAll(() => {
        connectDB();
    });

    afterAll(() => {
        disconnectDB();
        server.close();
    });

    describe('GET /api/v1/animals', () => {
        it('Get list of animals (empty)', async () => {
            const res = await request.get('/api/v1/animals');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBe(0);
        });
    });
});