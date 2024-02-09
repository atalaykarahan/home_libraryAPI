import { RequestHandler } from "express";
import BookModel from "../models/book";
import AuthorModel from "../models/author";
import PublisherModel from "../models/publisher";
import StatusModel from "../models/status";
import createHttpError from "http-errors";
import db from "../../db";
import BookCategoryModel from "../models/book_category";

export const getBooks: RequestHandler = async (req, res, next) => {
  try {
    const books = await BookModel.findAll({
      attributes: ["book_id", "book_title", "book_summary"],
      include: [
        { model: AuthorModel },
        { model: PublisherModel },
        { model: StatusModel },
      ],
    });
    res.status(200).json(books);

    // BookModel.findAll().then((b) => {
    //   res.status(200).json(b);
    // });
  } catch (error) {
    next(error);
  }
};

interface InsertBookBody {
  book_title?: string;
  author_id?: number;
  publisher_id?: number;
  status_id?: number;
  categories_id?: number[];
  book_summary?: string;
}
export const insertBook: RequestHandler<
  unknown,
  unknown,
  InsertBookBody,
  unknown
> = async (req, res, next) => {
  const book_title = req.body.book_title;
  const author_id = req.body.author_id;
  const publisher_id = req.body.publisher_id;
  const status_id = req.body.status_id;
  const categories_id = req.body.categories_id;
  const book_summary = req.body.book_summary;
  const t = await db.transaction();
  try {
    if (
      !book_title ||
      !author_id ||
      !status_id ||
      !categories_id ||
      !book_summary
    )
      throw createHttpError(400, "Missing parameters");

    let existingBook;
    if (publisher_id) {
      existingBook = await BookModel.findOne({
        where: { book_title: book_title, publisher_id: publisher_id },
      });
    } else {
      existingBook = await BookModel.findOne({
        where: { book_title: book_title },
      });
    }
    if (existingBook) throw createHttpError(409, "Book already exists");

    let createdBook;
    if (publisher_id) {
      createdBook = await BookModel.create(
        {
          book_title: formatBookTitle(book_title),
          author_id: author_id,
          publisher_id: publisher_id,
          status_id: status_id,
          book_summary: book_summary,
        },
        { transaction: t }
      );
    } else {
      createdBook = await BookModel.create(
        {
          book_title: formatBookTitle(book_title),
          author_id: author_id,
          status_id: status_id,
          book_summary: book_summary,
        },
        { transaction: t }
      );
    }

    //after creating book create book and categories relationship
    for (const category_id of categories_id) {
      await BookCategoryModel.create(
        {
          book_id: createdBook.book_id,
          category_id: category_id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json(createdBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

function capitalizeFirstLetter(text: string): string {
  return text.toLowerCase().replace(/(?:^|\s)\S/g, function (char) {
    return char.toUpperCase();
  });
}

function formatBookTitle(bookTitle: string): string {
  const exceptions = ["ve"];
  const words = bookTitle.toLowerCase().split(" ");

  for (let i = 0; i < words.length; i++) {
    if (!exceptions.includes(words[i]) || i === 0 || i === words.length - 1) {
      words[i] = capitalizeFirstLetter(words[i]);
    }
  }

  return words.join(" ");
}
