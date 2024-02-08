import { RequestHandler } from "express";
import StatusModel from "../models/status";

export const getAllStatuses: RequestHandler = async (req, res, next) => {
  try {
    const result = await StatusModel.findAll();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
