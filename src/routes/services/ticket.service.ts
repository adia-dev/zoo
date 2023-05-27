import { Types } from 'mongoose';
import { Ticket, ITicket, Space, ISpace } from '../models';
import { SpaceService } from './space.service';

export class TicketService {


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
                { $push: { visitedSpaces: spaceId } },
                { new: true }
            );
            return ticket;
        } catch (error) {
            throw new Error('Failed to add visited space to the ticket');
        }
    }

    public async updateLastVisitedSpace(ticketId: string, spaceId: string): Promise<ITicket | null> {
        try {
            const ticket = await Ticket.findByIdAndUpdate(ticketId, { lastUsedSpaceId: spaceId }, { new: true });
            return ticket;
        } catch (error) {
            throw new Error('Failed to update last visited space for the ticket');
        }
    }

    public async useTicket(ticketId: string, spaceId: string): Promise<ITicket | null> {
        try {

            // get the space
            const space = await (new SpaceService()).getSpaceById(spaceId.toString());

            if (space == null) {
                throw new Error('Space not found');
            }

            const ticket = await Ticket.findById(ticketId)
                .populate('allowedSpaces')
                .populate('visitedSpaces')
                .populate('lastUsedSpaceId')
                .populate('escapeGameSpaces');

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

            if (ticket.allowedSpaces.length == 0) {
                throw new Error('No allowed spaces for this ticket, please contact the administrator');
            }

            if (ticket.allowedSpaces.length == ticket.visitedSpaces.length) {
                throw new Error('You have already visited all the spaces');
            }

            if (ticket.escapeGameSpaces.length > 0 && ticket.escapeGameSpaces.length == ticket.visitedSpaces.length) {
                throw new Error('You have already finished the escape game');
            }


            // Check if the space is allowed for the ticket
            const allowedSpaceIds = ticket.allowedSpaces.map((space) => space._id.toString());
            if (!allowedSpaceIds.includes(spaceId)) {
                throw new Error('Space not allowed for the ticket');
            }

            // Check if the space is not already visited
            const visitedSpaceIds = ticket.visitedSpaces.map((space) => space._id.toString());
            if (visitedSpaceIds.includes(spaceId)) {
                throw new Error('Space already visited');
            }

            // Check if the space is not an escape game space or not at the top of the list
            const escapeGameSpaceIds = ticket.escapeGameSpaces.map((space) => space._id.toString());
            const currentEscapeGameStep = ticket.escapeGameStep;
            if (currentEscapeGameStep >= 0 && currentEscapeGameStep < escapeGameSpaceIds.length) {
                const nextEscapeGameSpaceId = escapeGameSpaceIds[currentEscapeGameStep];
                if (nextEscapeGameSpaceId !== spaceId) {
                    throw new Error(`You must visit the spaces in the correct order. The next space is ${nextEscapeGameSpaceId}`);
                }
            }

            // Update the ticket with the visited space and last used space
            ticket.visitedSpaces.push((space) as ISpace & Types.ObjectId);
            ticket.lastUsedSpaceId = spaceId;
            if (escapeGameSpaceIds.includes(spaceId)) {
                ticket.escapeGameStep += 1;
            }
            await ticket.save();

            return ticket;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Failed to use ticket');
        }
    }



    // Add more methods as needed to interact with other fields

}
