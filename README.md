# webjobs.node
A small node site

This site allows the user to request web URLs in a browser form and see the results of their requests. Updates appear
automatically (no refresh needed) as long as the browser websocket is connected. The results can be viewed on a details page.

This is a sample work project for a job application. I solved the problem using a combination of technologies:
* Node.js express server
* Websockets for two-way browser <-> server communication
* Redis Pub/Sub for event queue
* Redis database for data storage
* Promise-based architecture built on Bluebird

The data model is represented by:
* __Job__ represents the user's request and stores the URL, status, and result. Errors are also stored in the result.
* __Queue__ manages jobs and creates workers to work them.
* __Worker__ performs the request and saves the result.
