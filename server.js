const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const upload = require('express-fileupload');
require('dotenv').config({ path: 'variables.env' });
const cors = require('cors');
//const detectEncoding = require("detect-encoding");

const app = express();

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8002;


app.use(bodyParser.urlencoded({ limit: "4mb", extended: true, parameterLimit: 4000 }))
app.use(bodyParser.json({ limit: "4mb" }))
app.use(cors());
app.use(upload({
	limits: { fileSize: 4 * 1024 * 1024 },
}));


MongoClient.connect(process.env.DB_URL, (err, database) => {
	const myAwesomeDB = database.db('InstantPhotoDB')
	if (err) return console.log(err)
	require('./app/routes')(app, myAwesomeDB);
	app.listen(port, () => {
		console.log("We are live on " + port);
	})



})