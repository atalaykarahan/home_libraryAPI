import { RequestHandler } from "express";
import StatusModel from "../models/status";
import { Op } from "sequelize";

export const getAllStatuses: RequestHandler = async (req, res, next) => {
  try {
    const result = await StatusModel.findAll();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyStatuses: RequestHandler = async (req, res, next) => {
  try {
    const result = await StatusModel.findAll({
      where:{
        status_id:{
          [Op.in]:[1,3,4]
        }
      }
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
