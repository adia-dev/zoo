import { Request, Response, Router } from 'express';
import { ITicket } from '../models/ticket.model';
import { TicketService } from '../services/ticket.service';
import { Types } from 'mongoose';
import { RedisClient } from '../config';

export class TicketController {
    private ticketService: TicketService;

    constructor(redisClient: RedisClient) {
        this.ticketService = new TicketService(redisClient)
    }

    routes(): Router {
        const router = Router();

        router.get('/', this.getTickets.bind(this));
        router.post('/', this.createTicket.bind(this));
        router.get('/:id', this.getTicketById.bind(this));
        router.put('/:id', this.updateTicket.bind(this));
        router.delete('/:id', this.deleteTicket.bind(this));
        router.post('/:id/use', this.useTicket.bind(this));
        router.post('/:id/exit', this.useTicketToExit.bind(this));

        return router;
    }


    public async getTickets(req: Request, res: Response): Promise<void> {
        try {
            const tickets = await this.ticketService.getTickets();
            res.status(200).json(tickets);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch tickets' });
        }
    }

    public async createTicket(req: Request, res: Response): Promise<void> {
        try {
            const ticketData: ITicket = req.body;
            const newTicket = await this.ticketService.createTicket(ticketData);
            res.status(201).json(newTicket);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to create ticket' });
        }
    }

    public async getTicketById(req: Request, res: Response): Promise<void> {
        try {
            const ticketId: string = req.params.id;
            const ticket = await this.ticketService.getTicketById(ticketId);
            if (ticket) {
                res.status(200).json(ticket);
            } else {
                res.status(404).json({ error: 'Ticket not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch ticket' });
        }
    }

    public async updateTicket(req: Request, res: Response): Promise<void> {
        try {
            const ticketId: string = req.params.id;
            const updatedTicketData: ITicket = req.body;
            const updatedTicket = await this.ticketService.updateTicket(ticketId, updatedTicketData);
            if (updatedTicket) {
                res.status(200).json(updatedTicket);
            } else {
                res.status(404).json({ error: 'Ticket not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update ticket' });
        }
    }

    public async deleteTicket(req: Request, res: Response): Promise<void> {
        try {
            const ticketId: string = req.params.id;
            await this.ticketService.deleteTicket(ticketId);
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete ticket' });
        }
    }

    public async useTicket(req: Request, res: Response): Promise<void> {
        try {
            const ticketId: string = req.params.id;
            const spaceId: string = req.body.spaceId;

            if (!spaceId) {
                res.status(400).json({ error: 'Space id is required' });
                return;
            }

            if (!ticketId) {
                res.status(400).json({ error: 'Ticket id is required' });
                return;
            }

            if (!Types.ObjectId.isValid(spaceId)) {
                res.status(400).json({ error: 'Space id must be a valid ID related to a space' });
                return;
            }

            if (typeof ticketId !== 'string') {
                res.status(400).json({ error: 'Ticket id must be a valid ID related to a ticket' });
                return;
            }

            const updatedTicket = await this.ticketService.useTicket(ticketId, spaceId);
            if (updatedTicket) {
                res.status(200).json(updatedTicket);
            } else {
                res.status(404).json({ error: 'Ticket not found' });
            }
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to use ticket' });
        }
    }

    public async useTicketToExit(req: Request, res: Response): Promise<void> {
        try {
            const ticketId: string = req.params.id;
            await this.ticketService.useTicketToExit(ticketId);
            res.status(200).json({ message: 'Ticket used to exit' });
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to use ticket' });
        }
    }
}
