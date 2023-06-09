import { Types } from 'mongoose';
import { Ticket, ITicket, Space, ISpace, TicketType, ITicketRecord } from '../models';
import { SpaceService } from './space.service';
import { RedisClient } from '../config';
import { EntryType, ZooService } from './zoo.service';



export class TicketService {

    private redisClient: RedisClient;
    private zooService: ZooService;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
        this.zooService = new ZooService(redisClient);
    }

    public async getTickets(): Promise<ITicket[]> {
        try {
            const tickets = await Ticket.find();
            return tickets;
        } catch (error) {
            throw new Error('Failed to fetch tickets');
        }
    }


    public async createTicket(ticket: ITicket): Promise<ITicket> {
        try {

            if (ticket.validUntil < ticket.validFrom) {
                throw new Error('The expiration date must come after the start date');
            }

            // check all the spaces to see if they are valid or under maintenance
            for (let i = 0; i < ticket.spaces.length; i++) {
                const ticketSpace = ticket.spaces[i];

                if (!Types.ObjectId.isValid(ticketSpace.toString())) {
                    throw new Error(`Invalid space id ${ticketSpace}`);
                }
                const space = await Space.findById(ticketSpace);

                if (space == null) {
                    throw new Error(`Space ${ticketSpace} not found`);
                }

                if (space.isUnderMaintenance) {
                    if (space.expectedMaintenanceEnd && space.expectedMaintenanceEnd > (new Date())) {
                        throw new Error(`Space ${space._id} is under maintenance until ${space.expectedMaintenanceEnd}`);
                    }
                    throw new Error(`Space ${space._id} is under maintenance`);
                }
            }


            const newTicket = await Ticket.create(ticket);
            return newTicket;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create ticket');
        }
    }

    public async getTicketById(ticketId: string): Promise<ITicket | null> {
        return await Ticket.findById(ticketId);
    }

    public async updateTicket(ticketId: string, updatedTicket: ITicket): Promise<ITicket | null> {
        try {
            const ticket = await Ticket.findByIdAndUpdate(ticketId, updatedTicket, { new: true });
            return ticket;
        } catch (error) {
            throw new Error('Failed to update ticket');
        }
    }

    public async deleteTicket(ticketId: string): Promise<void> {
        try {
            await Ticket.findByIdAndDelete(ticketId);
        } catch (error) {
            throw new Error('Failed to delete ticket');
        }
    }

    public async addVisitedSpace(ticketId: string, spaceId: string): Promise<ITicket | null> {
        try {
            const ticket = await Ticket.findByIdAndUpdate(
                ticketId,
                { $push: { visitedSpaces: { spaceId } } },
                { new: true }
            );
            return ticket;
        } catch (error) {
            throw new Error('Failed to add visited space to the ticket');
        }
    }

    public async updateLastVisitedSpace(ticketId: string, spaceId: string): Promise<ITicket | null> {
        try {
            const ticket = await Ticket.findByIdAndUpdate(ticketId, { lastVisitedSpace: spaceId }, { new: true });
            return ticket;
        } catch (error) {
            throw new Error('Failed to update last visited space for the ticket');
        }
    }

    public async useTicket(ticketId: string, spaceId: string): Promise<ITicket | null> {
        try {
            const space = await (new SpaceService()).getSpaceById(spaceId.toString());

            if (space == null) {
                throw new Error('Space not found');
            }

            const ticket = await Ticket.findById(ticketId)
                .populate('spaces')
                .populate('visitedSpaces')
                .populate('lastVisitedSpace');

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // check if the space is under maintenance
            if (space.isUnderMaintenance) {
                throw new Error('Space under maintenance');
            }

            // Check if the ticket is not expired
            if (ticket.validUntil < new Date()) {
                throw new Error('Ticket expired');
            }

            if (ticket.spaces.length == 0) {
                throw new Error('No allowed spaces for this ticket, please contact the administrator');
            }

            if (ticket.spaces.length == ticket.visitedSpaces.length) {
                if (ticket.ticketType == TicketType.EscapeGame) {
                    throw new Error('You have already finished the escape game');
                }
                throw new Error('You have already visited all the spaces');
            }

            // Check if the space is allowed for the ticket
            const spaceIds = ticket.spaces.map((space) => {
                if (space instanceof Types.ObjectId) {
                    return space.toString();
                }
                return space._id.toString();
            });

            if (!spaceIds.includes(spaceId)) {
                throw new Error('Space not allowed for the ticket');
            }

            // Check if the space is not already visited
            const visitedSpaceIds = ticket.visitedSpaces.map(({ space }) => {
                if (space instanceof Types.ObjectId) {
                    return space.toString();
                }
                return space._id.toString();
            });

            if (visitedSpaceIds.includes(spaceId)) {
                throw new Error('Space already visited');
            }



            if (ticket.ticketType === TicketType.EscapeGame) {

                // Check if the space is not an escape game space or not at the top of the list
                const escapeGameSpaceIds = ticket.spaces.map((space) => space._id.toString());
                const currentEscapeGameStep = ticket.escapeGameStep;

                if (currentEscapeGameStep >= 0 && currentEscapeGameStep < escapeGameSpaceIds.length) {
                    const nextEscapeGameSpaceId = escapeGameSpaceIds[currentEscapeGameStep];
                    if (nextEscapeGameSpaceId !== spaceId) {
                        throw new Error(`You must visit the spaces in the correct order. The next space is ${nextEscapeGameSpaceId}`);
                    }
                }

                if (escapeGameSpaceIds.includes(spaceId)) {
                    ticket.escapeGameStep += 1;
                }
            }

            // Update the ticket with the visited space and last used space
            const ticketRecord: Partial<ITicketRecord> = { space: space._id };
            ticket.visitedSpaces.push(ticketRecord as ITicketRecord); // <-- I hate this
            ticket.lastVisitedSpace = spaceId;

            const updatedTicket = await ticket.save();

            return updatedTicket;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to use ticket');
        }
    }



    public async useTicketToExit(ticketId: string): Promise<void> {
        try {
            const ticket = await Ticket.findById(ticketId);

            if (!ticket) {
                throw new Error('Ticket not found, please contact the administrator to allow an exit without a ticket');
            }
            else if (!ticket.valid) {
                throw new Error('Ticket already used to exit');
            }

            await this.zooService.addEntryOrExit(ticketId, new Date(), EntryType.Exit);
            await this.updateTicket(ticketId, { valid: false } as ITicket);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to use ticket to exit');
        }
    }


    public async useTicketToEnter(ticketId: string): Promise<void> {
        try {
            const ticket = await Ticket.findById(ticketId);

            if (!ticket) {
                throw new Error('Ticket not found, please contact the administrator to allow an entry without a ticket');
            }
            else if (!ticket.valid) {
                throw new Error('Ticket is not valid, it seems to have been used to exit');
            } else if (ticket.validUntil < new Date()) {
                throw new Error(`Ticket expired on ${ticket.validUntil}`);
            } else if (ticket.validFrom > new Date()) {
                throw new Error(`Ticket not valid yet, will be ready to use at ${ticket.validFrom}`);
            }

            await this.zooService.addEntryOrExit(ticketId, new Date(), EntryType.Entry);
            await this.updateTicket(ticketId, { valid: false } as ITicket);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to use ticket to enter');
        }
    }
}
