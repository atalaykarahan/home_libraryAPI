const StatusEnum = {
  okunuyor: "1",
  kitaplikta: "2",
  okundu: "3",
  yarim_birakildi: "4",
  satin_alinacak: "6",
  okundu_kitaplikta_degil: "7",
  kitaplikta_degil: "11",
};

const EventTypeEnum = {
  category_create: "8",
  category_delete: "9",
  category_update: "10",
  translator_create: "11",
  translator_delete: "12",
  translator_update: "13",
  book_category_create: "14",
  book_category_update: "15",
  book_translator_create: "16",
  book_translator_update: "17",
  book_translator_delete: "18",
  publisher_create: "19",
  publisher_delete: "20",
  publisher_update: "21",
  author_create: "22",
  author_delete: "23",
  author_update: "24",
  book_create: "25",
  book_delete: "26",
  book_update: "27",
  reading_create: "28",
  reading_delete: "29",
  reading_update: "30",
  user_create: "31",
  user_delete: "32",
  user_update: "35",
  login_error: "33",
  error: "34",
};


export {StatusEnum, EventTypeEnum}
