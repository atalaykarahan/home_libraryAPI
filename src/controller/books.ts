import { RequestHandler } from "express";
import BookModel from "../models/book";
import AuthorModel from "../models/author";
import PublisherModel from "../models/publisher";
import StatusModel from "../models/status";
import createHttpError from "http-errors";
import db from "../../db";
import BookCategoryModel from "../models/book_category";
import { formatBookTitle } from "../custom-functions";
import LogModel from "../models/log";
import ReadingModel from "../models/reading";

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
  } catch (error) {
    next(error);
  }
};

//#region INSERT BOOK
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
    //if user send a missing parameters
      if (
      !book_title ||
      !author_id ||
      !status_id ||
      !categories_id ||
      !book_summary ||
      !publisher_id
    )
      throw createHttpError(400, "Missing parameters");

    /* check is user  already have this book in his library
    and also if user select publisher id we search it with that */

    const existingBook = await BookModel.findOne({
      where: { book_title: book_title, publisher_id: publisher_id },
    });

    if (existingBook) throw createHttpError(409, "Book already exists");

    //after this line all insert transaction is begins

    let createdBook;
    let createdReading;
    switch (status_id) {
      //reading
      case 1:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: author_id,
            status_id: 12,
            publisher_id: publisher_id,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const category_id of categories_id) {
          await BookCategoryModel.create(
            {
              book_id: createdBook.book_id,
              category_id: category_id,
            },
            { transaction: t }
          );
        }

        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: status_id,
          },
          {
            transaction: t,
          }
        );

        //create book log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            event_type_id: 25,
          },
          { transaction: t }
        );

        //create reading log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            reading_id: createdReading.reading_id,
            event_type_id: 28,
          },
          { transaction: t }
        );

        break;
      //in the library &
      case 2:
      case 6:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: author_id,
            status_id: status_id,
            publisher_id: publisher_id,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const category_id of categories_id) {
          await BookCategoryModel.create(
            {
              book_id: createdBook.book_id,
              category_id: category_id,
            },
            { transaction: t }
          );
        }

        //create book log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            event_type_id: 25,
          },
          { transaction: t }
        );

        break;
      //readed
      case 3:
      case 4:
        //create book & left unfinished
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: author_id,
            status_id: 2,
            publisher_id: publisher_id,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const category_id of categories_id) {
          await BookCategoryModel.create(
            {
              book_id: createdBook.book_id,
              category_id: category_id,
            },
            { transaction: t }
          );
        }

        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: status_id,
          },
          {
            transaction: t,
          }
        );

        //create book log type must be 25
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            event_type_id: 25,
          },
          { transaction: t }
        );

        //create reading log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            reading_id: createdReading.reading_id,
            event_type_id: 28,
          },
          { transaction: t }
        );
        break;
      //readed, not in the library
      case 7:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: author_id,
            status_id: 11,
            publisher_id: publisher_id,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const category_id of categories_id) {
          await BookCategoryModel.create(
            {
              book_id: createdBook.book_id,
              category_id: category_id,
            },
            { transaction: t }
          );
        }

        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: 3,
          },
          {
            transaction: t,
          }
        );

        //create book log type must be 25
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            event_type_id: 25,
          },
          { transaction: t }
        );

        //create reading log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            reading_id: createdReading.reading_id,
            event_type_id: 28,
          },
          { transaction: t }
        );
        break;
      default:
        throw createHttpError(500, "undefined status id");
        break;
    }

    await t.commit();
    /* For now, we are returning the created book, this is just for testing, then we just return staus code 201. */
    res.status(201).json(createdBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
//#endregion