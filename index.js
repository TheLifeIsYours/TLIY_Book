const TLIY_Book = require('./TLIY_Book');

const Book = new TLIY_Book();
Book.scanText('./books/The-Lions-of-the-Lord1.txt');
Book.makeSentence({words: 80, startWord: "tenkte", sorted: "lowest", cooldown: 30, dictionary: "The-Lions-of-the-Lord1"}); //Traverses by number of words, randomly picked