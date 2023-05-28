import mongoose = require('mongoose');
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongoInst: MongoMemoryServer;

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error("Mongo URI not found, please check your .env file");
        }

        if (process.env.NODE_ENV === 'test') {
            mongoInst = await MongoMemoryServer.create();
            mongoURI = mongoInst.getUri();
        }

        const conn = await mongoose.connect(mongoURI, {
            auth: {
                username: process.env.MONGODB_USER,
                password: process.env.MONGODB_PASSWORD,
            },
            authSource: 'admin',
        });

        if (process.env.NODE_ENV !== 'test')
            console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        if (mongoInst) {
            await mongoInst.stop();
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

export { connectDB, disconnectDB };