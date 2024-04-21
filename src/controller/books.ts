import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { Sequelize } from "sequelize";
import db from "../../db";
import { formatBookTitle } from "../custom-functions";
import { Option } from "../models/GeneralModel";
import AuthorModel from "../models/author";
import BookModel from "../models/book";
import UserModel from "../models/user";
import BookCategoryModel from "../models/book_category";
import LogModel from "../models/log";
import PublisherModel from "../models/publisher";
import CategoryModel from "../models/category";
import ReadingModel from "../models/reading";
import StatusModel from "../models/status";
import { EventTypeEnum, StatusEnum } from "../util/enums";
import { getFileToS3, uploadFileToS3 } from "../util/s3";
import { insertAuthorFunction } from "./author";
import { insertBookCategoryFunction } from "./book_category";
import { insertCategoryFunction } from "./category";
import { insertPublisherFunction } from "./publisher";
import { bool } from "envalid";

//#region GET ALL BOOKS
export const getBooks: RequestHandler = async (req, res, next) => {
  try {
    const books = await BookModel.findAll({
      attributes: ["book_id", "book_title", "book_summary", "book_image"],
      include: [
        { model: AuthorModel },
        { model: PublisherModel },
        { model: StatusModel },
      ],
    });

    for (const book of books) {
      if (book.book_image) {
        const imageUrl = await getFileToS3(book.book_image);
        if (imageUrl) book.book_image = imageUrl;
      }
    }

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region INSERT BOOK
interface InsertBookBody {
  categories?: string;
  book_title?: string;
  status?: string;
  author?: string;
  publisher?: string;
  book_summary?: string;
}

export const insertBook: RequestHandler<
  unknown,
  unknown,
  InsertBookBody,
  unknown
> = async (req, res, next) => {
  const book_title = req.body.book_title;
  const author: Option[] = JSON.parse(req.body.author ?? "");
  const publisher: Option[] = JSON.parse(req.body.publisher ?? "");
  const status: Option[] = JSON.parse(req.body.status ?? "");
  const categories: Option[] = JSON.parse(req.body.categories ?? "");
  const book_summary = req.body.book_summary;
  const t = await db.transaction();

  try {
    //if user send a missing parameters
    if (
      !book_title ||
      !author ||
      !publisher ||
      !status ||
      !categories ||
      !book_summary
    )
      throw createHttpError(400, "Missing parameters");

    //burdaki alttaki kodlar resim atmanın örneği
    // console.log("req file", req.file);

    /* check in if book is already exists
     * if they are exists we throw a error  */
    if (author[0].key && publisher[0].key) {
      const existingBook = await BookModel.findOne({
        where: {
          book_title: book_title,
          publisher_id: publisher[0].key,
          author_id: author[0].key,
        },
      });
      if (existingBook) throw createHttpError(409, "This book already exists.");
    }

    // check if author is not included than we create it
    const insertAuthorId =
      author[0].key ??
      (await insertAuthorFunction(req.session.user_id, author[0].label, t));

    //check if publisher is not included than we create it
    const insertPublisherId =
      publisher[0].key ??
      (await insertPublisherFunction(
        req.session.user_id,
        publisher[0].label,
        t
      ));

    let newCateogriesId: string[] = [];
    for (const category of categories) {
      console.log(category);

      if (category.key) {
        newCateogriesId.push(category.key);
      } else {
        const insertCategoryId = await insertCategoryFunction(
          req.session.user_id,
          category.label,
          t
        );
        newCateogriesId.push(insertCategoryId);
      }
    }

    console.log("yeni kategoriler bunlar", newCateogriesId);

    let createdBook;
    let createdReading;
    switch (status[0].key) {
      case StatusEnum.okunuyor:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: insertAuthorId,
            status_id: StatusEnum.okunuyor.toString(),
            publisher_id: insertPublisherId,
            book_summary: book_summary,
          },
          { transaction: t }
        );
        //after creating book, create book and categories relationship
        for (const categoryId of newCateogriesId) {
          await insertBookCategoryFunction(
            req.session.user_id,
            createdBook.book_id,
            categoryId,
            t
          );
        }
        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: StatusEnum.okunuyor,
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
            event_type_id: EventTypeEnum.book_create,
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
            event_type_id: EventTypeEnum.reading_create,
          },
          { transaction: t }
        );

        break;
      //in the library &
      case StatusEnum.kitaplikta:
      case StatusEnum.satin_alinacak:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: insertAuthorId,
            status_id: StatusEnum.satin_alinacak,
            publisher_id: insertPublisherId,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const categoryId of newCateogriesId) {
          await insertBookCategoryFunction(
            req.session.user_id,
            createdBook.book_id,
            categoryId,
            t
          );
        }

        //create book log
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            book_id: createdBook.book_id,
            event_type_id: EventTypeEnum.book_create,
          },
          { transaction: t }
        );

        break;
      //readed
      case StatusEnum.okundu:
      case StatusEnum.yarim_birakildi:
        //create book & left unfinished
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: insertAuthorId,
            status_id: StatusEnum.kitaplikta.toString(),
            publisher_id: insertPublisherId,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const categoryId of newCateogriesId) {
          await insertBookCategoryFunction(
            req.session.user_id,
            createdBook.book_id,
            categoryId,
            t
          );
        }

        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: status[0].key,
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
            event_type_id: EventTypeEnum.book_create,
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
            event_type_id: EventTypeEnum.reading_create,
          },
          { transaction: t }
        );
        break;
      //readed, but not in the library
      case StatusEnum.okundu_kitaplikta_degil:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: insertAuthorId,
            status_id: StatusEnum.kitaplikta_degil.toString(),
            publisher_id: insertPublisherId,
            book_summary: book_summary,
          },
          { transaction: t }
        );

        //after creating book, create book and categories relationship
        for (const categoryId of newCateogriesId) {
          await insertBookCategoryFunction(
            req.session.user_id,
            createdBook.book_id,
            categoryId,
            t
          );
        }

        //create reading part
        createdReading = await ReadingModel.create(
          {
            user_id: req.session.user_id,
            book_id: createdBook.book_id,
            status_id: StatusEnum.okundu,
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
            event_type_id: EventTypeEnum.book_create,
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
            event_type_id: EventTypeEnum.reading_create,
          },
          { transaction: t }
        );
        break;
      default:
        throw createHttpError(500, "undefined status id");
        break;
    }

    if (req.file) {
      await uploadFileToS3(`${createdBook.book_id}`, req.file);
      createdBook.book_image = createdBook.book_id;
      createdBook.save();
    }

    await t.commit();
    res.status(201).json(createdBook);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
//#endregion

//#region DELETE BOOOK
export const deleteBook: RequestHandler = async (req, res, next) => {
  const book_id = req.params.book_id;
  const user_id = req.session.user_id;
  const t = await db.transaction();

  try {
    if (!book_id || !user_id) createHttpError(400, "missing parameters");

    const createBookLog = await LogModel.findOne({
      where: {
        user_id: user_id,
        book_id: book_id,
        event_type_id: EventTypeEnum.book_create,
      },
    });
    if (!createBookLog)
      throw createHttpError(403, "You are not authorized to delete this data.");

    const readings = await ReadingModel.findAll({
      where: { book_id: book_id },
    });

    if (readings.length > 0)
      throw createHttpError(
        409,
        "The book cannot be deleted because there are associated readings."
      );

    await BookCategoryModel.destroy({
      where: { book_id: book_id },
      transaction: t,
    });
    await BookModel.destroy({ where: { book_id: book_id }, transaction: t });

    await LogModel.create(
      {
        user_id: user_id,
        book_id: book_id,
        event_type_id: EventTypeEnum.book_delete,
      },
      { transaction: t }
    );

    t.commit();
    res.sendStatus(204);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

//#endregion

//#region USER BOOK GRID COLLAPSE LIST
export const userBookGridCollapseList: RequestHandler = async (
  req,
  res,
  next
) => {
  const user_id = req.params.user_id;
  try {
    const user = await UserModel.findByPk(user_id);
    if (!user || user.user_library_visibility)
      throw createHttpError(
        404,
        "Either such user does not exist or the user's library is private."
      );

    const books = await BookModel.findAll({
      attributes: [
        "book_id",
        "book_title",
        "book_image",
        [
          Sequelize.literal(`(
          SELECT status_name
          FROM "STATUS" as "status"
          RIGHT JOIN "READING" as "reading" on "reading"."status_id" = "status"."status_id"
          where "reading"."user_id" = ${user_id} and "reading"."book_id" = "BOOK"."book_id"
          and "reading"."deletedAt" IS null
    )`),
          "status",
        ],
      ],
      include: [
        {
          model: ReadingModel,
          where: { user_id: user_id },
          required: true,
          attributes: [],
        },
      ],
    });

    for (const book of books) {
      if (book.book_image) {
        const imageUrl = await getFileToS3(book.book_image);
        if (imageUrl) book.book_image = imageUrl;
      }
    }

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET LAST INSERTED REACHABLE BOOK
export const getLastInsertedReachableBook: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const lastBook = await BookModel.findOne({
      attributes: ["book_id", "book_title", "book_summary", "book_image"],
      include: [
        {
          model: AuthorModel,
          attributes: ["author_name", "author_surname"],
        },
        { model: PublisherModel, attributes: ["publisher_name"] },
        {
          model: CategoryModel,
          attributes: ["category_id", "category_name"],
          as: "categories",
          through: { attributes: [] },
        },
      ],
      where: { status_id: 2 },
      order: [["book_id", "desc"]],
    });

    if (!lastBook){
      // res.sendStatus(200)
      res.status(200).send("Last inserted book not found");
      return
      // throw createHttpError(200, "Last inserted book not found");
    } 

    if (lastBook.book_image) {
      const imageUrl = await getFileToS3(lastBook.book_image);
      if (imageUrl) lastBook.book_image = imageUrl;
    }

    res.status(200).json(lastBook);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET RANDOM BOOK RECOMMENDATION
export const getRandomBookRecommendation: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const random4Books = await BookModel.findAll({
      attributes: ["book_id", "book_title", "book_summary", "book_image"],
      where: {
        status_id: 2,
      },
      order: Sequelize.literal("RANDOM()"), // Rastgele sıralama için
      limit: 4,
    });

    if (!random4Books) throw createHttpError(404, "random 4 books not found");

    //get each book image
    for (const book of random4Books) {
      if (book.book_image) {
        const imageUrl = await getFileToS3(book.book_image);
        if (imageUrl) book.book_image = imageUrl;
      }
    }

    res.status(200).json(random4Books);
  } catch (error) {
    next(error);
  }
};
//#endregion
