const TLIY_Book = require('./TLIY_Book');

const Book = new TLIY_Book();
Book.scanText('./books/The-Lions-of-the-Lord1.txt');
//Book.makeSentence(50); //Traverses by number of words, randomly picked