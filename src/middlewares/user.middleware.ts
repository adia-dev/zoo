import { Request, RequestHandler } from 'express';
import { IUser, ISession, SessionModel, IRole } from '../models';

declare module 'express' {
  export interface Request {
    user?: IUser;
  }
}

export function checkUserToken(roles?: string[]): RequestHandler {
  console.log(`Check user token with roles ${roles}`);
  return async function (req: Request, res, next) {
    try {
      const authorization = req.headers['authorization'];
      

      if (authorization === undefined) {
        res.status(401).json({error: 'Please provide an authorization token'}); // unauthorized

        return;
      }
      console.log(authorization);
      const parts = authorization.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'Invalid authorization token format. Please provide a valid Bearer token' });
        return;
      }

      const token = parts[1];
      console.log(token);

      // populate permet de faire une jointure sur la collection qui est deriere le champs user
      const session = await SessionModel.findById(token)
        .populate({
          path: 'user',
          populate: {
            path: 'role',
          },
        })
        .exec();

      if (session === null) {
        res.status(401).end(); // unauthorized
        return;
      }


      if (roles) {
        const role = (session.user as IUser).role
        if (role) {
          if (roles.indexOf((role as IRole).name) === -1) {
            res.status(403).end();
            return;
          }
        }


      }
      req.user = session.user as IUser;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
