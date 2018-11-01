var express = require("express");
var app = express();
var PORT = 8080; // default port 8000
var cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

function generateRandomString() {
  var alphaNums = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var alphaNumString = "";
  // '6' sets string to 6 characters by calling function 6 times
  // and concatenating to alphNumString
  for (var i = 0; i < 6; i++) {
    alphaNumString += alphaNums.charAt(Math.floor(Math.random() * alphaNums.length));
  }

  return alphaNumString;
};

// database object containing short and long URLS
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// users object for storing and accessing users in the app
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// ENDPOINTS / ROUTES


// GET ROUTES


// send get request to server
app.get("/", (req, res) => {
  res.send("Hello!");
});

// route handler for "/urls" uses res.render() to pass the URL data to your template
app.get("/urls", (req, res) => {
  // When sending variables to an EJS template,
  // you need to send them inside an object,
  // even if you are only sending one variable.
  // This is so you can use the key of that variable
  // (in this case the key is /urls) to access the data within your template
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies.user_id]};
  // gives /urls/new access to the logged-in username displayed in the header partial
  res.render("urls_index", templateVars);
});

// send get request to server asking to return the URL database at http://localhost:8080/urls.json
// (http://localhost:8080/urls.json will display the urlDatabase object)
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// send get request to server to display "Hello World"
// at http://localhost:8080/hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET route to render the urls_new.ejs template
// in the browser, to present the form to the user
// The GET /urls/new route is defined before the GET /urls/:id route because
// Routes defined earlier will take precedence, and the path /urls/new actually
// matches the /urls/:id pattern (with the :id placeholder matching the
// string "new" instead of an actual id.
// So, in case of overlap, routes should be ordered from most specific to least specific.
app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies.user_id]};
  // gives /urls/new access to the logged-in username displayed in the header partial
  res.render("urls_new", templateVars);
});

//route renders urls_show.ejs template.
// ":id" in "/urls/:id" indicates that the ID, or key,
// of the url will be in that part of the URL.
app.get("/urls/:id", (req, res) => {
  const key = req.params.id;
  // creates new object to pass to the template which
  // includes the short and long URLs
  res.render("urls_show", { shortURL: key,
                            longURL: urlDatabase[key],
                            user: users[req.cookies.user_id],
                            });
});

// GET route handler for shortURL requests
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];

  res.redirect('/urls');
});

// GET /register endpoint, which returns a page that
// includes a form with an email and password field.
app.get('/register', (req, res) => {
  res.render('urls_user_registration');
});

// GET login enpoint which renders the login
app.get('/login', (req, res) => {
  // WITHOUT TEMPLATE VARS USER IS UNDEFINED IN URLS_LOGIN
  let templateVars = {user: users[req.cookies.user_id]};
  res.render('urls_login', templateVars);
});



// POST ROUTES



// route for POST request for deleting URLS
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

// route for POST request for updating URLS:
// replaces longURL with user's input in the form in urls_show.ejs
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.updateURL;
  res.redirect('/urls');
})

// route that will match POST request (in urls_new) and handle it.
// this POST route definition logs the request body and gives a dummy response ('Ok').
app.post("/urls/new", (req, res) => {
  const longURL = req.body.longURL
  const shortURL = generateRandomString();
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies.user_id]};
  // req.body = the long URL that was input
  // adds new entry to the database: set the key as a new
  // random string generated by the generate random string function,
  // and set the key's value to the longURL (req.body.longURL)
  urlDatabase[shortURL] = longURL;
  res.redirect('http://localhost:8080/urls/' + shortURL);
  res.render('/urls/new', templateVars) // Respond with 'Ok' (we will replace this)
});

// POST route for login - sets cookie to username
app.post("/login", (req, res) => {
  for (var userId in users) {
    // finds a user that matches the email submitted via the login form
    // and compares user password with the password entered in the form
    if (users[userId].email === req.body.email && users[userId].password === req.body.password) {
        // set the user_id cookie with the matching user's random ID, then redirect to '/''
        res.cookie('user_id', userId);
        res.redirect('/urls');
        return;
      }
    }
    res.status(403);
    res.send('user does not exist')
});

// POST route for logout form
app.post("/logout", (req, res) => {
  // clears/delete user's login cookie and redirects to /urls
  res.clearCookie("user_id", {});
  res.redirect("/urls");
});

// adds a new user object in the global users object
// which keeps track of the newly registered user's
// email, password and user ID.
app.post('/register', (req, res) => {
  let userRandomId = generateRandomString();
  // checks if an email (req.body.email)
  // or password (req.body.password) has been entered into the form
  // and if not responds with 400 status code
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Enter an email and password")
  } else {
    // loops through users object, checks if form email
    // input matches any already in the users object
    // and if so responds with 400 status code
    for (var userId in users) {
      if (req.body.email === users[userId]['email']) {
        res.status(400);
        res.send('email already exists!');
        // only need to include 'return' to invoke the if statement
        return;
      }
    }
  }
  // adds new users object to the global 'users' object
  users[userRandomId] = {
    id: userRandomId,
    // request body of email and password fields in
    // urls_user_registration form and sets them as user's information
    email: req.body.email,
    password: req.body.password
  };

  // Sets a 'user_id' cookie containing the user's (newly generated) ID.
  res.cookie('user_id', userRandomId);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});