# WeNote Server Setup

This is the integrated server rendered with Node JS. If you clone this locally, make sure you run the commend `npm install` to install all the dependencies.

Once everything is installed, run the command `node server` or `npm start` to initiate the server. This is required to be able to use the Login / Register on the client side

### Properties of the Server
  - Connects front end operations to the back end database / JSON.
  - Retrieves / Updates notes or user information.
  - Socket connections between different clients.
  - Operates asynchronously with every operation.
  - Notes are saved in a JSON tree and a local folder. Each note is synchronized with a .html and .txt render.
