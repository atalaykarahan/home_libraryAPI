// export const requiresAuth: RequestHandler = (req, res, next) => {
//     if (req.session.user_id) {
//       next();
//     } else {
//       next(createHttpError(401, "User not authenticated"));
//     }
//   };

// function capitalizeFirstLetter(text: string): string {
//     return text.toLowerCase().replace(/(?:^|\s)\S/g, function (char) {
//       return char.toUpperCase();
//     });
//   }

export function capitalizeFirstLetter(text: string): string {
  return text.toLowerCase().replace(/(?:^|\s)\S/g, function (char) {
    return char.toUpperCase();
  });
}

export function formatBookTitle(bookTitle: string): string {
  const exceptions = ["ve"];
  const words = bookTitle.toLowerCase().split(" ");

  for (let i = 0; i < words.length; i++) {
    if (!exceptions.includes(words[i]) || i === 0 || i === words.length - 1) {
      words[i] = capitalizeFirstLetter(words[i]);
    }
  }

  return words.join(" ");
}

export function turkceBuyukHarfeDonustur(metin: string): string {
  const harfDuzeltici: { [key: string]: string } = {
    i: "İ",
    ı: "I",
  };

  return metin
    .replace(/([iı])/g, function (match) {
      return harfDuzeltici[match];
    })
    .toUpperCase();
}
