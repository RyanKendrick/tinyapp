// HTTP web server that simply responds with a string containing the request path

const http = require("http");
const PORT = 8080;

// generates a random alpha numberic string 6 characters long
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

// a function which handles requests and sends response:
// requestHandler is registered as a callback function that
// we register with the http module via its createServer function.
// The callback receives request and response arguments.
// We read values from the request, and send a
// string back to the client using the response object.
function requestHandler(request, response) {
  // response.end(`Requested Path: ${request.url}\nRequest Method: ${request.method}`);
  // if statement produces different results depending on the request path.
  if (request.url == "/") {
    response.end("Welcome!");
  } else if (request.url == "/urls") {
    response.end("www.lighthouselabs.ca\nwww.google.com");
  } else {
    // to see the 404 code in the browser, check network tab in DevTools.
    response.statusCode = 404;
    response.end("Unknown Path");
  }
}

var server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Server listening on: http://localhost:${PORT}`);
});

