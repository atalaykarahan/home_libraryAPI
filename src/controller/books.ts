import { RequestHandler } from "express";
import BookModel from "../models/book";
import AuthorModel from "../models/author";
import PublisherModel from "../models/publisher";
import StatusModel from "../models/status";
import createHttpError from "http-errors";
import db from "../../db";
import BookCategoryModel from "../models/book_category";
import CategoryModel from "../models/category";
import { formatBookTitle, turkceBuyukHarfeDonustur } from "../custom-functions";
import LogModel from "../models/log";
import ReadingModel from "../models/reading";
import { EventTypeEnum, StatusEnum } from "../util/enums";
import { Op, Sequelize } from "sequelize";
import { Option } from "../models/GeneralModel";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import env from "../util/validateEnv";
import { Express } from "express-serve-static-core";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadFileToS3 } from "../util/s3";

// const bucketName = env.BUCKET_NAME;
// const bucketRegion = env.BUCKET_REGION;
// const bucketAccessKey = env.BUCKET_ACCESS_KEY;
// const bucketSecretAccesskey = env.BUCKET_SECRET_ACCESS_KEY;

// const s3 = new S3Client({
//   region: bucketRegion,
//   credentials: {
//     accessKeyId: bucketAccessKey,
//     secretAccessKey: bucketSecretAccesskey,
//   },
// });

//#region GET ALL BOOKS
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
    // console.log("req body", req.body);
    // console.log("req file", req.file);

    // check in if book is exists
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


    //check if author is not included than we create it
    let insertAuthorId = author[0].key ?? "";
    if (!author[0].key) {
      const existingAuthorList = await AuthorModel.findAll({
        where: {
          [Op.or]: [
            { author_name: { [Op.iLike]: `%${author[0].label}%` } },
            { author_surname: { [Op.iLike]: `%${author[0].label}%` } },
          ],
        },
      });
      if (existingAuthorList.length > 0)
        throw createHttpError(409, "this author already exists.");

      //check the author has a surname
      const words = author[0].label.split(" ");

      //has a surname
      let createdAuthor;
      if (words.length > 1) {
        const lastName = words.pop();
        const firstName = words.join(" ");

        createdAuthor = await AuthorModel.create(
          {
            author_name: firstName,
            author_surname: lastName,
          },
          { transaction: t }
        );
      } else {
        //surname exists
        createdAuthor = await AuthorModel.create(
          {
            author_name: author[0].label,
          },
          { transaction: t }
        );
      }

      await LogModel.create(
        {
          user_id: req.session.user_id,
          event_date: new Date(),
          author_id: createdAuthor.author_id,
          event_type_id: EventTypeEnum.author_create,
        },
        { transaction: t }
      );
      insertAuthorId = createdAuthor.author_id;
    }

    //check if publisher is not included than we create it
    let insertPublisherId = publisher[0].key ?? "";
    if (!publisher[0].key) {
      const existingPublisherList = await PublisherModel.findAll({
        where: {
          publisher_name: { [Op.iLike]: `%${publisher[0].label}%` },
        },
      });
      if (existingPublisherList.length > 0)
        throw createHttpError(409, "this publisher already exists.");

      //check the author has a surname

      //has a surname
      const createdPublisher = await PublisherModel.create(
        {
          publisher_name: turkceBuyukHarfeDonustur(publisher[0].label),
        },
        { transaction: t }
      );

      await LogModel.create(
        {
          user_id: req.session.user_id,
          event_date: new Date(),
          publisher_id: createdPublisher.publisher_id,
          event_type_id: EventTypeEnum.publisher_create,
        },
        { transaction: t }
      );
      insertPublisherId = createdPublisher.publisher_id;
    }

    //check if categories is not included than we create it
    let newCateogriesId = [];
    categories.forEach(async (category) => {
      console.log(category);
      //create new category
      if(!category.key){
        const createdCategory = await CategoryModel.create(
          {
            category_name: formatBookTitle(category.label),
          },
          { transaction: t }
        );
    
        await LogModel.create(
          {
            user_id: req.session.user_id,
            event_date: new Date(),
            category_id: createdCategory.category_id,
            event_type_id: EventTypeEnum.category_create,
          },
          { transaction: t }
        );

        newCateogriesId.push(createdCategory.category_id);
      }

    })

      let createdBook;
    let createdReading;
    switch (status[0].key) {
      //reading
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
        for (const category_id of categories) {
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
            author_id: author_id,
            status_id: status_id.toString(),
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
            author_id: author_id,
            status_id: StatusEnum.kitaplikta.toString(),
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
      //readed, not in the library
      case StatusEnum.okundu_kitaplikta_degil:
        //create book
        createdBook = await BookModel.create(
          {
            book_title: formatBookTitle(book_title),
            author_id: author_id,
            status_id: StatusEnum.kitaplikta_degil.toString(),
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




    // for (const authorItem of author) {
    //   console.log(authorItem.key); // her bir yazarın key değerini konsola yazdırır
    // }

    // if (req.file) {
    //   await uploadFileToS3("atalay", req.file);
    // }

    //--------- ------------------

    /* check is user already have this book in library
    and also if user select publisher id we search it with that */

    // const existingBook = await BookModel.findOne({
    //   where: { book_title: book_title, publisher_id: publisher_id },
    // });

    // if (existingBook) throw createHttpError(409, "This book already exists.");

    //after this line all insert transaction is begins

    // let createdBook;
    // let createdReading;
    // switch (status_id) {
    //   //reading
    //   case StatusEnum.okunuyor:
    //     //create book
    //     createdBook = await BookModel.create(
    //       {
    //         book_title: formatBookTitle(book_title),
    //         author_id: author_id,
    //         status_id: StatusEnum.okunuyor.toString(),
    //         publisher_id: publisher_id,
    //         book_summary: book_summary,
    //       },
    //       { transaction: t }
    //     );

    //     //after creating book, create book and categories relationship
    //     for (const category_id of categories_id) {
    //       await BookCategoryModel.create(
    //         {
    //           book_id: createdBook.book_id,
    //           category_id: category_id,
    //         },
    //         { transaction: t }
    //       );
    //     }

    //     //create reading part
    //     createdReading = await ReadingModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         book_id: createdBook.book_id,
    //         status_id: status_id,
    //       },
    //       {
    //         transaction: t,
    //       }
    //     );

    //     //create book log
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         event_type_id: EventTypeEnum.book_create,
    //       },
    //       { transaction: t }
    //     );

    //     //create reading log
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         reading_id: createdReading.reading_id,
    //         event_type_id: EventTypeEnum.reading_create,
    //       },
    //       { transaction: t }
    //     );

    //     break;
    //   //in the library &
    //   case StatusEnum.kitaplikta:
    //   case StatusEnum.satin_alinacak:
    //     //create book
    //     createdBook = await BookModel.create(
    //       {
    //         book_title: formatBookTitle(book_title),
    //         author_id: author_id,
    //         status_id: status_id.toString(),
    //         publisher_id: publisher_id,
    //         book_summary: book_summary,
    //       },
    //       { transaction: t }
    //     );

    //     //after creating book, create book and categories relationship
    //     for (const category_id of categories_id) {
    //       await BookCategoryModel.create(
    //         {
    //           book_id: createdBook.book_id,
    //           category_id: category_id,
    //         },
    //         { transaction: t }
    //       );
    //     }

    //     //create book log
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         event_type_id: EventTypeEnum.book_create,
    //       },
    //       { transaction: t }
    //     );

    //     break;
    //   //readed
    //   case StatusEnum.okundu:
    //   case StatusEnum.yarim_birakildi:
    //     //create book & left unfinished
    //     createdBook = await BookModel.create(
    //       {
    //         book_title: formatBookTitle(book_title),
    //         author_id: author_id,
    //         status_id: StatusEnum.kitaplikta.toString(),
    //         publisher_id: publisher_id,
    //         book_summary: book_summary,
    //       },
    //       { transaction: t }
    //     );

    //     //after creating book, create book and categories relationship
    //     for (const category_id of categories_id) {
    //       await BookCategoryModel.create(
    //         {
    //           book_id: createdBook.book_id,
    //           category_id: category_id,
    //         },
    //         { transaction: t }
    //       );
    //     }

    //     //create reading part
    //     createdReading = await ReadingModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         book_id: createdBook.book_id,
    //         status_id: status_id,
    //       },
    //       {
    //         transaction: t,
    //       }
    //     );

    //     //create book log type must be 25
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         event_type_id: EventTypeEnum.book_create,
    //       },
    //       { transaction: t }
    //     );

    //     //create reading log
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         reading_id: createdReading.reading_id,
    //         event_type_id: EventTypeEnum.reading_create,
    //       },
    //       { transaction: t }
    //     );
    //     break;
    //   //readed, not in the library
    //   case StatusEnum.okundu_kitaplikta_degil:
    //     //create book
    //     createdBook = await BookModel.create(
    //       {
    //         book_title: formatBookTitle(book_title),
    //         author_id: author_id,
    //         status_id: StatusEnum.kitaplikta_degil.toString(),
    //         publisher_id: publisher_id,
    //         book_summary: book_summary,
    //       },
    //       { transaction: t }
    //     );

    //     //after creating book, create book and categories relationship
    //     for (const category_id of categories_id) {
    //       await BookCategoryModel.create(
    //         {
    //           book_id: createdBook.book_id,
    //           category_id: category_id,
    //         },
    //         { transaction: t }
    //       );
    //     }

    //     //create reading part
    //     createdReading = await ReadingModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         book_id: createdBook.book_id,
    //         status_id: StatusEnum.okundu,
    //       },
    //       {
    //         transaction: t,
    //       }
    //     );

    //     //create book log type must be 25
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         event_type_id: EventTypeEnum.book_create,
    //       },
    //       { transaction: t }
    //     );

    //     //create reading log
    //     await LogModel.create(
    //       {
    //         user_id: req.session.user_id,
    //         event_date: new Date(),
    //         book_id: createdBook.book_id,
    //         reading_id: createdReading.reading_id,
    //         event_type_id: EventTypeEnum.reading_create,
    //       },
    //       { transaction: t }
    //     );
    //     break;
    //   default:
    //     throw createHttpError(500, "undefined status id");
    //     break;
    // }

    // await t.commit();
    await t.rollback();
    /* For now, we are returning the created book, this is just for testing, then we just return staus code 201. */
    // res.status(201).json(createdBook);
    res.send({});
  } catch (error) {
    // await t.rollback();
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
    const books = await BookModel.findAll({
      attributes: [
        "book_id",
        "book_title",
        "image_path",
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

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};
//#endregion
