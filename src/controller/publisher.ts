import { RequestHandler } from "express";
import PublisherModel from "../models/publisher";
import createHttpError from "http-errors";

export const getAllPublisher: RequestHandler = async (req, res, next) => {
  try {
    PublisherModel.findAll().then((b) => {
      res.status(200).json(b);
    });
  } catch (error) {
    next(error);
  }
};

export const insertPublisher: RequestHandler = async (req, res, next) => {
  const incomingPublisher = req.params.publisher;
  try {
    if (!incomingPublisher) throw createHttpError(400, "Missing parameters");

    //check same publisher is exists
    const publisher = await PublisherModel.findOne({
      where: { publisher_name: incomingPublisher },
    });

    if (publisher) {
      throw createHttpError(401, "This publisher already exists.");
    }

    await PublisherModel.create({
      publisher_name: incomingPublisher.toUpperCase(),
    });

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
