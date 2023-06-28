import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

const initClient = (): RedisClient => {
    const client = createClient({
        url: process.env.REDIS_URL,
    });

    client.on('error', (error) => {
        console.error(error);
    });

    client.on('connect', () => {
        console.log(`Connected to Redis`);
    });

    client.connect().then(() => {
        // j'ai zayé, pardonné moi
    });

    return client;
};

export { initClient };
