'use strict';

require('dotenv').config();

const express = require('express');

const superagent = require('superagent');

const methodOverride = require('method-override')

const pg = require('pg');

const PORT = process.env.PORT || 4060;

const server = express();

server.set('view engine', 'ejs');

server.use(express.static('./public'))

server.use(express.urlencoded({ extended: true }));

server.use(methodOverride('_method'));

//const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

server.set('view engine', 'ejs');


server.get('/', renderIndex);

server.get('/searches/new', (req, res) => {
    res.render('pages/searches/new');
});

server.post('/searches', handleNewSerach);

server.post('/books', insertBook);

server.get('/books/:id', moreAboutBook);

server.put('/updateBook/:id', updateBook);

server.delete('/deleteBook/:id', deleteBook);

// Functions
function renderIndex(req, res) {

    let SQL = `SELECT * FROM books;`;
    client.query(SQL)
        .then(results => {
            res.render('pages/index', { taskResults: results.rows, numberOfBooks: results.rows.length })
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

            //onsole.log('------------------------------insideSuper-------------------')
            //console.log('title', googleBooksData.body.items[5].volumeInfo);
            // console.log('title', googleBooksData.body.items[0].volumeInfo.title);
            // console.log('authors', googleBooksData.body.items[0].volumeInfo.authors);
            // console.log('imageLinks', googleBooksData.body.items[0].volumeInfo.imageLinks.thumbnail);
            // console.log('textSnippet', googleBooksData.body.items[0].searchInfo.textSnippet);
            let bookData = googleBooksData.body.items;
            let data = bookData.map(val => {
                const newBook = new Book(
                    val.volumeInfo.title,
                    val.volumeInfo.authors,
                    val.volumeInfo.industryIdentifiers,
                    val.volumeInfo.imageLinks,
                    val.volumeInfo.description,
                    val.volumeInfo.categories
                );
                return newBook;
            });
            res.render('pages/searches/shows', { allBooks: data });
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
    let { title, authors, isbn, imageLinks, description, categories } = req.body;
    let SQL = `INSERT INTO books (title, authors, isbn, imageLinks, description, categories) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`;
    let safeValues = [title, authors, isbn, imageLinks, description, categories];
    client.query(SQL, safeValues)
        .then(result => {
            //console.log(result.rows[0].id)
            res.redirect(`/books/${result.rows[0].id}`)
        })
}



function moreAboutBook(req, res) {
    //console.log(req.params.id);
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

function updateBook(req, res) {
    let { title, authors, isbn, imageLinks, description, categories } = req.body;
    let SQL = `UPDATE books SET title=$1, authors=$2, isbn=$3, imageLinks=$4, description=$5, categories=$6 WHERE id=$7;`;
    let safeValues = [title, authors, isbn, imageLinks, description, categories, req.params.id];
    client.query(SQL, safeValues)
        .then(() => {
            res.redirect(`/books/${req.params.id}`);
        })
}

function deleteBook(req, res) {
    let SQL = `DELETE FROM books WHERE id=$1;`;
    let safeValues = [req.params.id];
    client.query(SQL, safeValues)
        .then(res.redirect('/'))
}

function Book(title, authors, isbn, imageLinks, description, categories) {
    this.title = (title) ? title : 'There is no availble title';
    this.authors = (authors) ? authors.join(', ') : 'There is no availble authors';
    this.isbn = (isbn[0]) ? isbn[0].identifier : 'There is no availble ISBN';
    this.imageLinks = (imageLinks) ? imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.description = (description) ? description : 'There is no availble description';
    this.categories = (categories) ? categories[0] : 'There is no availble categories';
    Book.all.push(this);
}
Book.all = [];















client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`)
        })
    })
