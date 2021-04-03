const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const urlencodedParser = bodyParser.urlencoded
const nodemailer = require('nodemailer'); 
var fs = require('fs');
var pdf = require('html-pdf');
var options = {format:'A4'};


//Init App
const app = express();

mongoose.connect('mongodb://localhost/nodekb');
let db = mongoose.connection;

// check connection
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// check for DB errors
db.on('error', function(err){
    console.log(err);
});

//Bring in Models
let Article = require('./models/article.js');
const { urlencoded } = require('body-parser');
const { getMaxListeners } = require('./models/article.js');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  }));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Main page
app.get('/', function(req, res){
    res.render('layout', {
        title:'Sklep'
    });
  });

  app.get('/offers', function(req, res){
    res.render('offers', {
        title:'Dodaj produkt'
    });
  });

// Article Route
app.get('/article', function(req, res){
    Article.find({}, function(err, articles){
        if(err){
          console.log(err);  
        } else {
            res.render('index', {
            title: 'Dodaj brakujący produkt',
            articles: articles  
        }); 
        } 
    });     
});

// Get Single Article
app.get('/article/:id', function(req, res){
   Article.findById(req.params.id, function(err, article){
    res.render('article', {
        article:article
    });
   }); 
});

// Add Route
app.get('/articles/add', function(req, res){
  res.render('add_article', {
      title:'Dodaj produkt'
  });
});

// Add Submit POST Route
app.post('/articles/add', function(req, res){
        let article = new Article();
        article.title = req.body.title;  
        article.author = req.body.author;
        article.body = req.body.body;  
        
        article.save(function(err){
            if(err){
                console.log(err);
                return;
            } else {
                res.redirect('/article');
            }
        });
    }
);

// Load Edit Form
app.get('/article/edit/:id', function(req, res){
    Article.findById(req.params.id, function(err, article){
     res.render('edit_article', {
         title:'Edytuj produkt',
         article:article
     });
    }); 
 });

// Update Submit POST Route
app.post('/articles/edit/:id', function(req, res){
    let article = {};
    article.title = req.body.title;  
    article.author = req.body.author;
    article.body = req.body.body;  

    let query = {_id:req.params.id}

    Article.update(query, article, function(err){
        if(err){
            console.log(err);
            return;
        } else {
            res.redirect('/article');
            req.flash('Success','Produkt dodany')
        }
    });
});

//Delete article
app.delete('/article/:id', function(req, res){
    let query = {_id:req.params.id}

    Article.remove(query, function(err){
        if(err){
            console.log(err);
        }
        res.send('Success');
    });
});

// Convert PDF
app.get('/service', function(req, res){
    res.render('home_pdf')
});


app.post('/service', function(req,res){
    res.render('demo_pdf', {data:req.body.article1}, function(err,html) {
        pdf.create(html, options).toFile('./public/uploads/demopdf.pdf', function(err, result) {
            if (err){
                return console.log(err);
            }
            else {
            console.log(res);
            var datafile = fs.readFileSync('./public/uploads/demopdf.pdf');
            res.header('content-type', 'application/pdf');
            res.send(datafile);
            }
        });
    });
});

// Send Email
app.get('/contact', function(req, res) {
    res.render('contact_email', {
        title:'Kontakt'
    });
});

app.post('/send', (req, res) => {
    const output = `
    <p>Masz nowy kontakt</p>
    <h3>Informacje o kontakcie:</h3>
    <ul>
        <li>Name: ${req.body.name}</li>
        <li>Company: ${req.body.company}</li>
        <li>Email: ${req.body.email}</li>
        <li>Phone: ${req.body.phone}</li>
    </ul>
    <h3>Wiadomość</h3>
    <p>${req.body.message}</p>
    `;
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'neptuncafe.gd@gmail.com', // generated ethereal user
            pass: 'Gdansk12', // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false
        }
    });
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Neptun Cafe Gdansk" <neptuncafe.gd@gmail.com>', // sender address
        to: 'neptuncafe.gd@gmail.com', // list of receivers
        subject: "Nowe zgłoszenie od Neptun Cafe Gdańsk", // Subject line
        text: "Hello world?", // plain text body
        html: output, // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.render('contact_email', {msg: 'Wiadomość wysłana poprawnie 📨'});
    }); 
});

// Start Server
app.listen(3000, function(){
    console.log('Server nasłuchuje na porcie 3000...');
});