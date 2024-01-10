const express = require('express');
const pug = require('pug');
const path = require('path');
const fs = require("fs");
let router = express.Router();

const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Artist = require("./models/ArtistModel");
const Artwork = require("./models/ArtworkModel");
const Patron = require("./models/PatronModel");
const Comment = require("./models/CommentModel");
const Workshop = require("./models/WorkshopModel");
const Notification = require("./models/NotificationModel");

//Body parser
router.use(express.urlencoded({extended: true}));
router.use(express.json());


/**************************************************************
 * Handling of all Requests
 **************************************************************/


router.use('/', auth);

//handle get requests to the /browse page 
//this shows all artworks in no particular order
router.get("/", paginationBuilder, loadArtworks, sendArtworks); 

//handle get requests to the browse/search-results page 
//this shows all artworks that match search parameters, in no particular order
router.get("/search-results", paginationBuilder, parseQuery, loadArtworks, sendArtworks); 







/**************************************************************
 * Helper Functions
 **************************************************************/

//authorization function
function auth(req, res, next) {
	//check if there a loggedin property set for the session, and
	//if they have admin rights
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		//res.status(401).send("Unauthorized");
		return;
	}
	next();
}

//load artworks according to search results
async function loadArtworks(req, res, next) {
	let startIndex = ((req.query.page - 1) * req.query.limit);
	let amount = req.query.limit;

	//if input in search field is non-empty, search according to this input
	if(res.app.locals.search){
		let searchBy = res.app.locals.searchby;
		let search = res.app.locals.search;
		let searchParam = new RegExp('.*'+search+'.*', 'i');

		//query the artworks db, only pull the amount of results specified by limit
		res.app.locals.artworks = await Artwork.find()
												.where(searchBy).regex(searchParam)
												.limit(amount)
												.skip(startIndex)
												.exec();
		//now, query the db again to see if there is at least one more artwork past the artworks we just pulled. if so, we want a 'next' link on out page. use a bool to keep track of this
		let isNextArtwork= await Artwork.find()
											.where(searchBy).regex(searchParam)
											.limit(amount)
											.skip(startIndex+amount)
											.exec();
		//previous line returns an array, check if array is non-empty. if it is, it will have an object at index 0. if not, index 0 will return underfined 
		if(isNextArtwork[0]){
			res.app.locals.nextButton = true;
		}
		else{
			res.app.locals.nextButton = false;
		}
	}
	//otherwise, show all artworks. note that if the user presses 'search' but there is no text in the input field, it will interpret the request as showing all the artworks
	else{
		res.app.locals.artworks = await Artwork.find()
												.limit(amount)
												.skip(startIndex)
												.exec();
		//now, query the db again to see if there is at least one more artwork past the artworks we just pulled. if so, we want a 'next' link on out page. use a bool to keep track of this
		let isNextArtwork= await Artwork.find()
											.limit(amount)
											.skip(startIndex+amount)
											.exec();
		//previous line returns an array, check if array is non-empty. if it is, it will have an object at index 0. if not, index 0 will return underfined 
		if(isNextArtwork[0]){
			res.app.locals.nextButton = true;
		}
		else{
			res.app.locals.nextButton = false;
		}
	}

	next();
}

//render page with artworks
function sendArtworks(req, res, next) {
	res.render("browse", {artworks: res.app.locals.artworks, qstring: req.qstring, current: req.query.page, nextButton: res.app.locals.nextButton, theme: req.session.theme});
}

//create a query limit and page number variable to support pagination
function paginationBuilder(req, res, next) {
	const MAX_ARTWORKS = 50;

	//build a query string to use for pagination later
	let params = [];
	for (prop in req.query) {
		if (prop == "page") {
			continue;
		}
		params.push(prop + "=" + req.query[prop]);
	}
	req.qstring = params.join("&");

	try {
		req.query.limit = req.query.limit || 10;
		req.query.limit = Number(req.query.limit);
		if (req.query.limit > MAX_ARTWORKS) {
			req.query.limit = MAX_ARTWORKS;
		}
	} catch {
		req.query.limit = 3;
	}

	try {
		req.query.page = req.query.page || 1;
		req.query.page = Number(req.query.page);
		if (req.query.page < 1) {
			req.query.page = 1;
		}
	} catch {
		req.query.page = 1;
	}

	if (!req.query.name) {
		req.query.name = "?";
	}

	next();
}


//parse search parameters
function parseQuery(req, res, next) {
	tempSearchby = req.query.searchby;

	//convert 'search by' value from dropdown to corresponsing attribute in our db
	switch(tempSearchby){
		case "Photographer":
			tempSearchby = "Artist";
			break;
		case "Event":
			tempSearchby = "Category";
			break;
		case "Venue":
			tempSearchby = "Medium";
			break;
	}
	res.app.locals.searchby = tempSearchby.toLowerCase();
	res.app.locals.search = req.query.search;

	next();
}


module.exports = router;