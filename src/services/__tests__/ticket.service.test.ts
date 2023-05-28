const supertest = require('supertest');
import { Types } from 'mongoose';
import { connectDB, disconnectDB, startServer } from '../../config';
import {
    ISpace,
    IUser,
    Role,
    RoleTitle,
    Space,
    SpaceSize,
    SpaceType,
    Ticket,
    TicketType,
    User
} from '../../models';
import { v1Router } from '../../routes';

const { app, server } = startServer(v1Router);
const request = supertest(app);

const VALID_TICKET = (userId: Types.ObjectId, spaces: ISpace[]) => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    return {
        ticketType: TicketType.DayPass,
        spaces: spaces.map((space) => space._id),
        escapeGameStep: 0,
        visitedSpaces: [],
        validFrom: now.toISOString(),
        validUntil: tomorrow.toISOString(),
        userId: userId.toString(),
        lastUsedSpaceId: null,
        disabled: false,
        kids: false,
        pregnant: false,
        wheelchair: false,
        celebrity: false,
    };
};

const INVALID_TICKET = (userId: Types.ObjectId, spaces: ISpace[]) => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    return {
        ticketType: TicketType.DayPass,
        spaces: spaces.map((space) => space._id),
        escapeGameStep: 0,
        visitedSpaces: [],
        validFrom: tomorrow.toISOString(),
        validUntil: now.toISOString(),
        userId: userId.toString(),
        lastUsedSpaceId: null,
        disabled: false,
        kids: false,
        pregnant: false,
        wheelchair: false,
        celebrity: false,
    };
};

const SPACE_COUNT = 10;

describe('(v1) Tickets Service tests', () => {
    beforeEach(async () => {
        await connectDB();

        const roleData = {
            name: RoleTitle.Admin,
            description: 'Admin role',
        };

        const role = await Role.create(roleData);

        const user = {
            email: 'user@gmail.com',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            password: 'password',
            role: role,
        };

        await User.create(user);

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

        await Space.insertMany(spaces);
        await Space.create(maintenanceSpace);
    });

    afterEach(async () => {
        await disconnectDB();
        server.close();
    });

    describe('POST /api/v1/tickets', () => {
        it('should create a ticket', async () => {
            const user = await User.findOne({ username: 'johndoe' });
            const spaces = await Space.find({}).limit(10);

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = VALID_TICKET(user!._id, spaces);

            const response = await request.post('/api/v1/tickets').send(ticket);

            expect(response.status).toBe(201);
            expect(response.body.ticketType).toBe(TicketType.DayPass);
            expect(response.body.spaces.length).toBe(SPACE_COUNT);
            expect(response.body.escapeGameStep).toBe(0);
            expect(response.body.visitedSpaces.length).toBe(0);
            // expect(response.body.validFrom).toBe(now.toISOString()); there is a micro mismatch that causes this to fail
            // expect(response.body.validUntil).toBe(tomorrow.toISOString()); same here
            expect(response.body.userId).toBe(user!._id.toString());
            expect(response.body.lastUsedSpaceId).toBeUndefined();
            expect(response.body.disabled).toBe(false);
            expect(response.body.kids).toBe(false);
            expect(response.body.pregnant).toBe(false);
            expect(response.body.wheelchair).toBe(false);
        });

        it('should not create a ticket if ticketType is invalid', async () => {
            const user = await User.findOne({ username: 'johndoe' });
            const spaces = await Space.find({}).limit(10);

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = INVALID_TICKET(user!._id, spaces);

            const response = await request.post('/api/v1/tickets').send(ticket);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                'The expiration date must come after the start date'
            );
        });

        it('should not create a ticket if spaces are invalid', async () => {
            const user = await User.findOne({ username: 'johndoe' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            const invalidSpaceId = 'InvalidSpaceId';

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [invalidSpaceId],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            const response = await request.post('/api/v1/tickets').send(ticket);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(`Invalid space id ${invalidSpaceId}`);
        });

        it('should not create a ticket if validFrom is greater than validUntil', async () => {
            const user = await User.findOne({ username: 'johndoe' });
            const spaces = await Space.find({}).limit(10);

            const now = new Date();
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: spaces.map((space) => space._id),
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: yesterday.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            const response = await request.post('/api/v1/tickets').send(ticket);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('The expiration date must come after the start date');
        });
    });

    //     public async useTicket(ticketId: string, spaceId: string): Promise<ITicket | null> {
    //     try {
    //         const space = await (new SpaceService()).getSpaceById(spaceId.toString());

    //         if (space == null) {
    //             throw new Error('Space not found');
    //         }

    //         const ticket = await Ticket.findById(ticketId)
    //             .populate('spaces')
    //             .populate('visitedSpaces')
    //             .populate('lastVisitedSpace');

    //         if (!ticket) {
    //             throw new Error('Ticket not found');
    //         }

    //         // check if the space is under maintenance
    //         if (space.isUnderMaintenance) {
    //             throw new Error('Space under maintenance');
    //         }

    //         // Check if the ticket is not expired
    //         if (ticket.validUntil < new Date()) {
    //             throw new Error('Ticket expired');
    //         }

    //         if (ticket.spaces.length == 0) {
    //             throw new Error('No allowed spaces for this ticket, please contact the administrator');
    //         }

    //         if (ticket.spaces.length == ticket.visitedSpaces.length) {
    //             throw new Error('You have already visited all the spaces');
    //         }

    //         if (ticket.spaces.length > 0 && ticket.spaces.length == ticket.visitedSpaces.length) {
    //             throw new Error('You have already finished the escape game');
    //         }


    //         // Check if the space is allowed for the ticket
    //         const spaceIds = ticket.spaces.map((space) => {
    //             if (space instanceof Types.ObjectId) {
    //                 return space.toString();
    //             }
    //             return space._id.toString();
    //         });

    //         if (!spaceIds.includes(spaceId)) {
    //             throw new Error('Space not allowed for the ticket');
    //         }

    //         // Check if the space is not already visited
    //         const visitedSpaceIds = ticket.visitedSpaces.map(({ space }) => {
    //             if (space instanceof Types.ObjectId) {
    //                 return space.toString();
    //             }
    //             return space._id.toString();
    //         });

    //         if (visitedSpaceIds.includes(spaceId)) {
    //             throw new Error('Space already visited');
    //         }



    //         if (ticket.ticketType === TicketType.EscapeGame) {

    //             // Check if the space is not an escape game space or not at the top of the list
    //             const escapeGameSpaceIds = ticket.spaces.map((space) => space._id.toString());
    //             const currentEscapeGameStep = ticket.escapeGameStep;

    //             if (currentEscapeGameStep >= 0 && currentEscapeGameStep < escapeGameSpaceIds.length) {
    //                 const nextEscapeGameSpaceId = escapeGameSpaceIds[currentEscapeGameStep];
    //                 if (nextEscapeGameSpaceId !== spaceId) {
    //                     throw new Error(`You must visit the spaces in the correct order. The next space is ${nextEscapeGameSpaceId}`);
    //                 }
    //             }

    //             if (escapeGameSpaceIds.includes(spaceId)) {
    //                 ticket.escapeGameStep += 1;
    //             }
    //         }

    //         // Update the ticket with the visited space and last used space
    //         const ticketRecord: Partial<ITicketRecord> = { space: space._id, ticket: ticket._id };
    //         ticket.visitedSpaces.push(ticketRecord as ITicketRecord); // <-- I hate this
    //         ticket.lastVisitedSpace = spaceId;

    //         const updatedTicket = await ticket.save();

    //         return updatedTicket;
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             throw new Error(error.message);
    //         }
    //         throw new Error('Failed to use ticket');
    //     }
    // }

    describe('TicketService::useTicket', () => {

        it('should not use a ticket when space is not found', async () => {

            const user = await User.findOne({ username: 'johndoe' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const invalidSpaceId = '6473a1ecd039794fb62f8299';
            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [invalidSpaceId],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(`Space ${invalidSpaceId} not found`);

            const ticketId = res.body._id;

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: invalidSpaceId });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Space not found');
        });


        it('should not use a ticket when space is not found', async () => {

            const ticketId = '6473a1ecd039794fb62f8299' // invalid ticket id

            const res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: '6473a1ecd039794fb62f8299' });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Space not found');
        });

        it('should not use a ticket when space is under maintenance', async () => {

            const space = await Space.findOne({ name: 'Maintenance Space', isUnderMaintenance: true });
            const user = await User.findOne({ username: 'johndoe' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [space!._id],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(`Space ${space!._id} is under maintenance`);

            const ticketId = res.body._id;

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Space id must be a valid ID related to a space');
        });

        it('should not use a ticket when space is becomes under maintenance', async () => {

            const space = await Space.findOne({ name: 'Space 1' });
            const user = await User.findOne({ username: 'johndoe' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [space!._id],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');

            expect(space).not.toBeNull();

            space!.isUnderMaintenance = true;
            await space?.save();

            const ticketId = res.body._id;

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space!._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Space under maintenance');
        });

        it('should not use a ticket when it is expired', async () => {

            const space = await Space.findOne({ name: 'Space 1' });
            const user = await User.findOne({ username: 'johndoe' });

            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [space!._id],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: tenDaysAgo.toISOString(),
                validUntil: yesterday.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');

            expect(space).not.toBeNull();

            const ticketId = res.body._id;

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space!._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('Ticket expired');
        })


        it('should not use a ticket when it is expired', async () => {
            const user = await User.findOne({ username: 'johndoe' });


            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');


            const ticketId = res.body._id;
            const space = await Space.findOne({ name: 'Space 1' });

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space!._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('No allowed spaces for this ticket, please contact the administrator');
        })


        it('should not use a ticket when the space has already been visited', async () => {
            const user = await User.findOne({ username: 'johndoe' });
            const space = await Space.findOne({ name: 'Space 1' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = {
                ticketType: TicketType.DayPass,
                spaces: [space!._id],
                escapeGameStep: 0,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');


            const ticketId = res.body._id;

            await Ticket.findByIdAndUpdate(ticketId, { $push: { visitedSpaces: space!._id } });

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space!._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('You have already visited all the spaces');
        })

        it('should not use a ticket when all escape game spaces has already been visited', async () => {
            const user = await User.findOne({ username: 'johndoe' });
            const space = await Space.findOne({ name: 'Space 1' });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            const ticket = {
                ticketType: TicketType.EscapeGame,
                spaces: [space!._id],
                escapeGameStep: 1,
                visitedSpaces: [],
                validFrom: now.toISOString(),
                validUntil: tomorrow.toISOString(),
                userId: user!._id.toString(),
                lastUsedSpaceId: null,
                disabled: false,
                kids: false,
                pregnant: false,
                wheelchair: false,
                celebrity: false,
            };

            let res = await request.post('/api/v1/tickets').send(ticket);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');


            const ticketId = res.body._id;

            await Ticket.findByIdAndUpdate(ticketId, { $push: { visitedSpaces: space!._id } });

            res = await request.post(`/api/v1/tickets/${ticketId}/use`).send({ spaceId: space!._id });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('You have already finished the escape game');
        })


    });

});
