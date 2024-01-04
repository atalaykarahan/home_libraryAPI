import { RequestHandler } from "express";
import AuthorModel from "../models/author";
import createHttpError from "http-errors";


//GET ALL
export const getAuthors: RequestHandler = async (req, res, next) => {
  try {
    AuthorModel.findAll().then((a) => {
      res.status(200).json(a);
    });
  } catch (error) {
    next(error);
  }
};


// CREATE
interface CreateAuthorBody {
  author_name?: string;
  author_surname?: string;
}
export const createAuthor: RequestHandler<
  unknown,
  unknown,
  CreateAuthorBody,
  unknown
> = async (req, res, next) => {
  const author_name = req.body.author_name;
  const author_surname = req.body.author_surname;

  try {
    if (!author_name) {
      throw createHttpError(400, "Author must have a 'author name'");
    }

    const newAuthor = await AuthorModel.create({
      author_name: author_name,
      author_surname: author_surname,
    });

    res.status(201).json(newAuthor);
  } catch (error) {
    next(error);
  }
};


// GET BY ID
export const getAuthor: RequestHandler = async (req, res, next) => {
  const author_id = req.params.author_id;

  try {
    //error invalid author id format
    if (!author_id || isNaN(Number(author_id))) {
      throw createHttpError(400, "Invalid 'author id' format");
    }

    const author = await AuthorModel.findByPk(author_id);

    if (!author) {
      throw createHttpError(404, "Author not found");
    }

    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
};

// UPDATE
interface UpdateAuthorParams {
  author_id: number;
}
interface UpdateAuthorBody {
  author_name?: string;
  author_surname?: string;
}
export const updateAuthor: RequestHandler<
  UpdateAuthorParams,
  unknown,
  UpdateAuthorBody,
  unknown
> = async (req, res, next) => {
  const author_id = req.params.author_id;
  const newAuthorName = req.body.author_name;
  const newAuthorSurname = req.body.author_surname;

  try {
    if (!author_id || isNaN(Number(author_id))) {
      throw createHttpError(400, "Invalid 'user id' format");
    }
    if (!newAuthorName) {
      throw createHttpError(400, "Missing parameter : 'user name'");
    }

    const author = await AuthorModel.findByPk(author_id);

    //error author not found
    if (!author) {
      throw createHttpError(404, "Author not found");
    }

    author.author_name = newAuthorName;
    if (newAuthorSurname) author.author_surname = newAuthorSurname;

    const updatedAuthor = await author.save();
    res.status(200).json(updatedAuthor);
  } catch (error) {
    next(error);
  }
};


// DELETE
export const deleteAuthor: RequestHandler = async (req, res, next) => {
  const author_id = req.params.author_id;

  try {
    //error invalid author id format
    if (!author_id || isNaN(Number(author_id))) {
      throw createHttpError(400, "Invalid 'author id' format");
    }

    const author = await AuthorModel.findByPk(author_id);

    if (!author) {
      throw createHttpError(404, "Author not found");
    }

    await author.destroy();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
