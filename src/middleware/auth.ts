import { RequestHandler } from "express";
import createHttpError from "http-errors";

//only sign in user
export const requiresAuth: RequestHandler = (req, res, next) => {
  if (req.session.user_id) {
    next();
  } else {
    next(createHttpError(401, "User not authenticated"));
  }
};

//not guest authority level
export const requiresNotGuest: RequestHandler = (req, res, next) => {
  if(req.session.user_id && req.session.user_authority_id != 1){
    next();
  }else {
    next(createHttpError(401, "User not authenticated"));
  }
}
