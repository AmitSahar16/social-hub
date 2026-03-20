import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { verifyAccessToken } from '../utils/authUtils';


const optionalAuthMiddleware = (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = { _id: decoded._id };
      } catch (error) {
        
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    
    next();
  }
};

export default optionalAuthMiddleware;
