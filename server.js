'use strict';

require('dotenv').config();

const express = require('express');

const superagent = require('superagent');

const pg = require('pg');

const PORT = process.env.PORT || 4060;

const server = express();

server.set('view engine', 'ejs');

server.use(express.static('./public'))

server.use(express.urlencoded({ extended: true }));

const client = new pg.Client(process.env.DATABASE_URL);

server.set('view engine', 'ejs');


server.get('/', renderIndex);

server.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
});

server.post('/searches', handleNewSerach);

server.post('/books', insertBook);

server.get('/books/:id', moreAboutBook);


// Functions
function renderIndex(req, res) {

    let SQL = `SELECT * FROM books;`;
    client.query(SQL)
        .then(results => {
            res.render('pages/index', { taskResults: results.rows })
        })
        .catch(err => {
            res.render('pages/error', { errors: err });
        })
}

function handleNewSerach(req, res) {

    let serachWord = req.body.searchWord;

    let keyVal = process.env.GOOGLE_KEY;

    let serachMethod = req.body.serachMthod;

    const maxResults = 10;


    let googleBooksURL = `https://www.googleapis.com/books/v1/volumes?q=+${serachMethod}:${serachWord}&key=${keyVal}&maxResults=${maxResults}`;

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
                    val.volumeInfo.imageLinks,
                    val.volumeInfo.description
                );
                return newBook;
            });
            res.render('pages/searches/shows', { allBooks: Book.all });
        })

        .catch(error => {
            //console.log('Error in getting data from Google Books server')
            // console.error(error);
            res.render('pages/error', { errors: error });
        })
}


//http://localhost:4042/books
function insertBook(req, res) {
    //console.log(req.body);
    let { title, authors, imageLinks, description } = Book.all[req.body.idx];
    let SQL = `INSERT INTO books (title, authors, imageLinks, description) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let safeValues = [title, authors, imageLinks, description];
    client.query(SQL, safeValues)
        .then(result => {
            //console.log(result.rows[0].id)
            res.redirect(`/books/${result.rows[0].id}`)
        })
}



function moreAboutBook(req, res) {
    console.log(req.params.id);
    let SQL = `SELECT * FROM books where id=${req.params.id};`;
    client.query(SQL)
        .then(results => {
            //console.log(results.rows, 'hhhhh');
            res.render('pages/books/show', { taskResults: results.rows })
        })
        .catch(err => {
            res.render('pages/error', { errors: err });
        })
}



function Book(title, authors, imageLinks, description) {

    this.title = (title) ? title : 'There is no availble title';
    this.authors = (authors) ? authors.join(', ') : 'There is no availble authors';
    this.imageLinks = (imageLinks) ? imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.description = (description) ? description : 'There is no availble description';
    Book.all.push(this);
}
Book.all = [];















client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`)
        })
    })
