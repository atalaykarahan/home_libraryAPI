import { RequestHandler } from "express";
import createHttpError from "http-errors";
import db from "../../db";
import AuthorModel from "../models/author";
import BookModel from "../models/book";
import LogModel from "../models/log";
import PubliserModel from "../models/publisher";
import ReadingModel from "../models/reading";
import StatusModel from "../models/status";
import { StatusEnum, EventTypeEnum } from "../util/enums";
import { getFileToS3, removeFileToS3, uploadFileToS3 } from "../util/s3";

//#region GET USER READINGS
export const getMyReadings: RequestHandler = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    const myReadings: any = await ReadingModel.findAll({
      attributes: ["reading_id"],
      where: { user_id: user_id },
      include: [
        {
          model: BookModel,
          attributes: ["book_id", "book_title", "book_image"],
          include: [{ model: PubliserModel }, { model: AuthorModel }],
        },
        { model: StatusModel },
      ],
    });
    if (!myReadings) {
      throw createHttpError(404, "You have no reading record");
    }

    //if book has a image then we create a image link
    for (const reading of myReadings) {
      console.log(reading.BOOK.book_image);
      if (reading.BOOK.book_image) {
        const imageUrl = await getFileToS3(reading.BOOK.book_image);
        if (imageUrl) reading.BOOK.book_image = imageUrl;
      }
    }

    res.status(200).json(myReadings);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region REMOVE & DELETE READING
export const removeMyReading: RequestHandler = async (req, res, next) => {
  const user_id = req.session.user_id;
  const reading_id = req.params.reading_id;
  const t = await db.transaction();
  try {
    if (!reading_id) throw createHttpError(400, "Missing parameters");

    const reading = await ReadingModel.findByPk(reading_id);

    if (!reading) throw createHttpError(404, "Reading exists");

    console.log(reading);

    if (StatusEnum.okunuyor == reading.status_id) {
      const readingBook = await BookModel.findByPk(reading.book_id);

      if (!readingBook) throw createHttpError(404, "Book not found");
      readingBook.status_id = StatusEnum.kitaplikta;
      readingBook.save({ transaction: t });

      LogModel.create(
        {
          user_id: user_id,
          event_type_id: EventTypeEnum.book_update,
          book_id: readingBook.book_id,
        },
        { transaction: t }
      );
    }

    await ReadingModel.destroy({
      where: { reading_id: reading_id, user_id: user_id },
      transaction: t,
    });

    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.reading_delete,
        reading_id: reading_id,
      },
      { transaction: t }
    );

    t.commit();

    res.sendStatus(200);
  } catch (error) {
    t.rollback();
    next(error);
  }
};
//#endregion

//#region ADD NEW BOOK TO READING
export const addMyReading: RequestHandler = async (req, res, next) => {
  const t = await db.transaction();
  const book_id = req.params.book_id;
  const status_id = req.params.status_id;
  const user_id = req.session.user_id;
  try {
    if (!book_id || !status_id || !user_id)
      throw createHttpError(400, "Missing parameters");

    //check if user already add the book
    const isExist = await ReadingModel.findOne({
      where: {
        user_id: user_id,
        book_id: book_id,
      },
    });

    if (isExist) {
      throw createHttpError(409, "You already add this book");
    }
    //check if status is correct
    if (
      ![
        StatusEnum.okunuyor,
        StatusEnum.okundu,
        StatusEnum.yarim_birakildi,
      ].includes(status_id)
    )
      throw createHttpError(500, "Server error INVALID STATUS");

    //control if book is exists
    const book = await BookModel.findByPk(book_id);
    if (!book) throw createHttpError(500, "book is exists");

    /* if someone already reading this book or
     * user is want to reading this book we changed this book status */
    if (
      status_id == StatusEnum.okunuyor &&
      [
        `${StatusEnum.kitaplikta_degil}`,
        `${StatusEnum.satin_alinacak}`,
        `${StatusEnum.kitaplikta}`,
      ].includes(book.status_id.toString())
    ) {
      book.status_id = StatusEnum.okunuyor.toString();
      await book.save();
    } else if (
      status_id == StatusEnum.okunuyor &&
      book.status_id == StatusEnum.okunuyor
    ) {
      throw createHttpError(500, "Someone already reading this book");
    }

    const createdReading = await ReadingModel.create(
      {
        user_id: user_id,
        book_id: book_id,
        status_id: status_id,
      },
      { transaction: t }
    );

    await LogModel.create(
      {
        user_id: user_id,
        book_id: book_id,
        event_type_id: EventTypeEnum.reading_create,
        reading_id: createdReading.reading_id,
      },
      { transaction: t }
    );

    await t.commit();

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region UPDATE READING
interface UpdateMyReadingBody {
  reading_id?: string;
  status_id?: string;
  comment?: string;
  remove_book_image?: string;
}
export const updateMyReading: RequestHandler<
  unknown,
  unknown,
  UpdateMyReadingBody,
  unknown
> = async (req, res, next) => {
  const status_id = req.body.status_id;
  const comment = req.body.comment;
  const reading_id = req.body.reading_id;
  const remove_book_image = req.body.remove_book_image;
  const user_id = req.session.user_id;
  const t = await db.transaction();

  try {
    if (!reading_id || !user_id)
      throw createHttpError(400, "Missing parameter");

    const reading = await ReadingModel.findByPk(reading_id);

    if (!reading) throw createHttpError(500, "Server error existing reading");
    const book = await BookModel.findByPk(reading.book_id);

    if (!book) throw createHttpError(500, "Server error existing book");

    if (comment) {
      reading.comment = comment;
    } else {
      reading.comment = "";
    }

    if (status_id) {
      switch (reading.status_id) {
        case StatusEnum.okunuyor:
          // Okuma durumu 1 ise okunuyor ise
          if (
            [StatusEnum.okundu, StatusEnum.yarim_birakildi].includes(status_id)
          ) {
            // İstenen durum 3 veya 4 ise
            // Kitap durumu artık kitaplıkta
            book.status_id = StatusEnum.kitaplikta;
            await book.save({ transaction: t });
            await LogModel.create(
              {
                user_id: user_id,
                event_type_id: EventTypeEnum.book_update,
                book_id: book.book_id,
              },
              { transaction: t }
            );
          }
          break;
        case StatusEnum.okundu:
        case StatusEnum.yarim_birakildi:
          // Okuma durumu 3 veya 4 ise yani okundu | yarım bırakıldı
          // İstenen durum 1 ise kitap okunuyor durumuna geçer
          if (status_id == StatusEnum.okunuyor) {
            console.log("düştü *****************************");
            book.status_id = StatusEnum.okunuyor;
            await book.save({ transaction: t });
            await LogModel.create(
              {
                user_id: user_id,
                event_type_id: EventTypeEnum.book_update,
                book_id: book.book_id,
              },
              { transaction: t }
            );
          }
          break;
      }

      // Okuma durumunu istenen duruma güncelle
      reading.status_id = status_id;
    }

    await reading.save({ transaction: t });
    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.reading_update,
        book_id: book.book_id,
        reading_id: reading.reading_id,
      },
      { transaction: t }
    );

    if (req.file) {
      await uploadFileToS3(reading.book_id, req.file);
      book.book_image = book.book_id;
      book.save();
    } else if (remove_book_image) {
      await removeFileToS3(book.book_id);
      book.book_image = null;
      book.save();
    }

    await t.commit();

    res.sendStatus(200);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
//#endregion

//#region GET USER READING
export const getMyReading: RequestHandler = async (req, res, next) => {
  const reading_id = req.params.reading_id;
  try {
    if (!reading_id) throw createHttpError(400, "Missing parameter");

    /* r now we only return comment because we only need to comment.
     * but in the future if you need something anything else
     * you should chande this bottom code */
    const reading = await ReadingModel.findByPk(reading_id, {
      attributes: ["comment"],
    });
    if (!reading) throw createHttpError(400, "Reading is exists");

    res.status(200).json(reading);
  } catch (error) {
    next(error);
  }
};
//#endregion
