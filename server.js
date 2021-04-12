'use strict';

require('dotenv').config();

const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 4060;

const server = express();

server.set('view engine', 'ejs');

server.use(express.static('./public'))

server.use(express.urlencoded({ extended: true }));

server.get('/', (req, res) => {
    res.render('pages/index');
})

server.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
})

/* server.post('/searches', (req, res) => {
    res.render('pages/searches/shows');
}) */

server.post('/searches', handleNewSerach)



function handleNewSerach(req, res) {

    console.log(req.body.searchWord, 'the req');

    let serachWord = req.body.searchWord;

    let keyVal = process.env.GOOGLE_KEY;

    let serachMethod;

    let ifTitle = req.body.title;

    let ifAuthor = req.body.author;

    if (ifTitle === 'on') {
        serachMethod = 'intitle';
    } else if (ifAuthor === 'on') {
        serachMethod = 'inauthor';
    };
    console.log('serachMethod', serachMethod);

    const maxResults = 10;


    let googleBooksURL = `https://www.googleapis.com/books/v1/volumes?q=${serachWord}+${serachMethod}&key=${keyVal}&maxResults=${maxResults}`;

    superagent.get(googleBooksURL)
        .then(googleBooksData => {
            // console.log('------------------------------insideSuper-------------------')
            // console.log('title', googleBooksData.body.items[0].volumeInfo.title);
            // console.log('authors', googleBooksData.body.items[0].volumeInfo.authors);
            // console.log('imageLinks', googleBooksData.body.items[0].volumeInfo.imageLinks.thumbnail);
            // console.log('textSnippet', googleBooksData.body.items[0].searchInfo.textSnippet);
            let bookData = googleBooksData.body.items;
            let data = bookData.map(val => {
                const newBook = new Book(
                    val.volumeInfo.title,
                    val.volumeInfo.authors,
                    val.volumeInfo.imageLinks.thumbnail,
                    val.searchInfo.textSnippet
                );
                return newBook;
            })

            //let allBooks = Book.all; 
            res.render('pages/searches/shows', { allBooks: Book.all });

        })

        .catch(error => {
            console.log('Error in getting data from Google Books server')
            console.error(error);
            res.render('pages/error', { errors: error });
        })
}


function Book(title, authors, imageLinks, textSnippet) {
    this.title = title;
    this.authors = authors;
    this.imageLinks = imageLinks;
    this.textSnippet = textSnippet;
    Book.all.push(this);
}
Book.all = [];
















server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
})