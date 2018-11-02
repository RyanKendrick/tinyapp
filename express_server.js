const cookieSession = require('cookie-session')
const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8000
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['abc123'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

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
  "b2xVn2": {url: "http://www.lighthouselabs.ca", userID: 'userRandomId'},
  "9sm5xK": {url: "http://www.google.com", userID: 'userRandomId'}
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

// urlsForUser(id) is GLOBAL function which returns the subset object
// of the URL database that belongs to the user
// so that the route handler can remain clean
function urlsForUser(id) {
  let userUrls = {};
  for (let key in urlDatabase) {
    if (id ===  urlDatabase[key].userID) {
      userUrls[key] = urlDatabase[key].url;
    }
  }

  return userUrls;
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
  // to access the data within your template
  let templateVars = {
    // uses urlsForUser function to display only URLS that
    // are associated with the logged in user
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
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
                       user: users[req.session.user_id]};
    if (!req.session.user_id) {
    res.redirect('/login');
    return;
  };
  // gives /urls/new access to the logged-in username displayed in the header partial
  res.render("urls_new", templateVars);
});

//route renders urls_show.ejs template.
// ":id" in "/urls/:id" indicates that the ID, or key,
// of the url will be in that part of the URL.
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("not for you!");
    return;
  };
  const key = req.params.id;
  // creates new object to pass to the template which
  // includes the short and long URLs
  res.render("urls_show", { shortURL: key,
                            longURL: urlDatabase[key].url,
                            user: users[req.session.user_id],
                            });
});

// GET route handler for shortURL requests
app.get("/u/:shortURL", (req, res) => {

  let longURL = urlDatabase[req.params.shortURL].url;

  res.redirect(longURL);
});

// GET /register endpoint, which returns a page that
// includes a form with an email and password field.
app.get('/register', (req, res) => {
  res.render('urls_user_registration');
});

// GET login enpoint which renders the login
app.get('/login', (req, res) => {
  // WITHOUT TEMPLATE VARS USER IS UNDEFINED IN URLS_LOGIN
  let templateVars = {user: users[req.session.user_id]};
  res.render('urls_login', templateVars);
});



// POST ROUTES



// route for POST request for deleting URLS
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
  delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
})

// route for POST request for updating URLS:
// replaces longURL with user's input in the form in urls_show.ejs
app.post("/urls/:id/update", (req, res) => {
  // console.log(urlDatabase);
  // console.log(req.params.id);
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
  urlDatabase[req.params.id].url = req.body.updateURL;
  // console.log(urlDatabase);
  }
  res.redirect('/urls');
})

// route that will match POST request (in urls_new) and handle it.
// this POST route definition logs the request body and gives a dummy response ('Ok').
app.post("/urls/new", (req, res) => {
  const longURL = req.body.longURL
  const shortURL = generateRandomString();
  let templateVars = { urls: urlDatabase,
                       user: users[req.session.user_id]};
  if (!users[req.session.user_id]) {
    return res.redirect('/login');
  }

  // req.body = the long URL that was input
  // adds new entry to the database: set the key as a new
  // random string generated by the generate random string function,
  // and set the key's value to the longURL (req.body.longURL)
  // adds the new URL to the database WITH the user's cookie so it
  // is associated with that user only
  urlDatabase[shortURL] = {url: longURL, userID: req.session.user_id};
  console.log(urlDatabase);
  res.redirect('http://localhost:8080/urls/' + shortURL);
  // res.render('/urls/new', templateVars) // Respond with 'Ok' (we will replace this)
});

// POST route for login - sets cookie to username
app.post("/login", (req, res) => {
  for (var userId in users) {

    // finds a user that matches the email submitted via the login form
    // and compares user password with the password entered in the form
    if (users[userId].email === req.body.email && bcrypt.compareSync(req.body.password, users[userId].password)) {
        // set the user_id cookie with the matching user's random ID, then redirect to '/''
        //
        req.session.user_id = userId;
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
  req.session = null;
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
    password: bcrypt.hashSync(req.body.password, 10) // bcrypt hashsync hashes the password upon registration
  };

  // Sets a 'user_id' cookie containing the user's (newly generated) ID.
  req.session.user_id = userRandomId;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});