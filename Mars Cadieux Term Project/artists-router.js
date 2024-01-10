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

//handle get requests to the /artists page with all the artists
router.get("/", loadArtists, sendArtists); 

//put request to register/unregister
router.put("/workshops", toggleRegister); 

//a post request to an artist's page is interpreted as a follow/unfollow 
router.put("/:id", toggleFollow, sendSingleArtist); 

//handle get requests to each artist's page 
router.get("/:id", loadArtworks, loadWorkshops, sendSingleArtist); 

//post request to upload a new post
router.post("/newpost/:id", addPost); 

//post request to upload a new workshop
router.post("/newworkshop/:id", addWorkshop); 




/**************************************************************
 * Helper Functions 
 **************************************************************/

async function loadArtists(req, res, next){
	res.app.locals.artists = await Artist.find();
	next();
}

function sendArtists(req, res, next) {
	res.render("artists", {artists: res.app.locals.artists, theme: req.session.theme});
}

async function loadArtworks(req, res, next){
	let id = req.params.id;
	res.app.locals.artist = await Artist.find({_id: id}).populate('artworks').exec();

	//variable to keep track of whether the user is on their own profile. this will affect what functionality they have
	let isOwnProfile = false;
	if(req.session.username == res.app.locals.artist[0].username){
		isOwnProfile = true;
	}
	res.app.locals.isOwnProfile = isOwnProfile;
	next();
}

async function loadWorkshops(req, res, next){
	let id = req.params.id;
	res.app.locals.workshops = await Workshop.find({host: id}).populate('attendees').exec();
	let user = await User.find({_id: req.session.userId}).exec();

	//variable to keep track of whether the user is registered for each workshop
	for(const workshop of res.app.locals.workshops){
		//will be a boolean
		let attend = user[0].workshops.indexOf(workshop._id) != -1;
		//add an attribute to our local workshop object to track whether they attend
		workshop["attends"] = attend;
	}
	let isOwnProfile = false;
	if(req.session.username == res.app.locals.artist[0].username){
		isOwnProfile = true;
	}
	res.app.locals.isOwnProfile = isOwnProfile;

	next();
}

async function sendSingleArtist(req, res, next) {
	//'await Artist.find(...)' from previous middleware returns an array with one object, so we take the item at index 0 of this array to get our artist object
	let currentArtist = res.app.locals.artist[0];
	let followButtonText = "";
	let following = await User.find({username: req.session.username}).select('following -_id').exec();
	if(following[0].following.indexOf(currentArtist._id) != -1){
		followButtonText = "Unfollow";
	}
	else{
		followButtonText = "Follow";
	}

	res.render("artist", {artist: currentArtist, followButtonText: followButtonText, isOwnProfile: res.app.locals.isOwnProfile, workshops: res.app.locals.workshops, theme: req.session.theme}); 
}


async function toggleFollow(req, res, next){
	let artistId = req.params.id;

	let userID = await User.find().where("username").eq(req.session.username).select("_id").exec();
	let userFollowing = await User.find({_id: userID[0]}).select('following -_id').exec();
	let artistFollowers = await Artist.find({_id: artistId}).select('followers -_id').exec();


	if(userFollowing[0].following.indexOf(artistId) != -1){
		//the patron already follows this artist, so they are unfollowing them 
		let index = (userFollowing[0]).following.indexOf(artistId);
		(userFollowing[0]).following.splice(index, 1);

		await User.findByIdAndUpdate(userID[0], {following: (userFollowing[0]).following});

		index = (artistFollowers[0]).followers.indexOf(userID[0]);
		(artistFollowers[0]).followers.splice(index, 1);

		await Artist.findByIdAndUpdate(artistId, {followers: (artistFollowers[0]).followers});

		res.app.locals.followButtonText = "Follow";
	}
	else{
		//the patron does not follow the artist, so they are now following them
		(userFollowing[0]).following.push(artistId);

		await User.findByIdAndUpdate(userID[0], {following: (userFollowing[0]).following});
		(artistFollowers[0]).followers.push(userID[0]._id);

		await Artist.findByIdAndUpdate(artistId, {followers: (artistFollowers[0]).followers});
		res.app.locals.followButtonText = "Unfollow";
	}
	next();
}


//TODO: validation
async function addPost(req, res, next) {
	let artistId = req.params.id;
	let artist = await Artist.find({_id: artistId}).exec();
	let artworkData = req.body;
	console.log(artworkData);

	let art = new Artwork();
	art.title = (artworkData)["title"];
	art.artist = artist[0].name;
	art.year = (artworkData)["year"];
	art.category = (artworkData)["category"];
	art.medium = (artworkData)["medium"];
	art.description = (artworkData)["description"];
	art.poster = (artworkData)["poster"];
	art.likes = [];
	art.comments = [];

	try{
		//save the new artwork
		const result = await art.save();

		//now grab the id of this new artwork and add it to the artist's artworks array
		const newArtId = result._id;
		let artistArt = artist[0].artworks;
		artistArt.push(newArtId);
		await Artist.findByIdAndUpdate(artistId, {artworks: artistArt});

		//now create a notification for each of this artist's followers
		const followers = await Artist.find({_id: artistId}).populate("followers").exec();
		//I learned the hard way that this is not like a foreach loop. 'follower' is an index. this code looks disgusting but I don't have time to clean it up, soz
		//what's weird though is that every other time I used this kind of loop, it works like a foreach loop
		//idk oh well
		for(const follower in followers[0].followers){
			console.log("follower");
			//this prints an index
			console.log(follower);
			let newNotif = new Notification();
			newNotif.notified = (followers[0].followers)[follower]._id;
			newNotif.triggeredBy = artistId;
			newNotif.notificationType = "Photo";
			newNotif.postLink = newArtId;
			await newNotif.save();
		}
		res.status(201).send();
		
	}
	catch(err){
		console.log(err);
		res.status(400).send("Invalid entries.");
	}
}

//TODO: validation
async function addWorkshop(req, res, next) {
	let artistId = req.params.id;
	let artist = await Artist.find({_id: artistId}).exec();
	let workshopData = req.body;

	let workshop = new Workshop();
	workshop.title = (workshopData)["title"];
	workshop.host = artistId;
	workshop.day = (workshopData)["day"];
	workshop.time = (workshopData)["time"];
	workshop.attendees = [];

	try{
		//save the new workshop
		const result = await workshop.save();

		//now grab the id of this new artwork and add it to the artist's artworks array
		const newWS = result._id;
		let artistWS = artist[0].workshops;
		artistWS.push(newWS);
		await Artist.findByIdAndUpdate(artistId, {workshops: artistWS});

		//now create a notification for each of this artist's followers
		const followers = await Artist.find({_id: artistId}).populate("followers").exec();
		//I learned the hard way that this is not like a foreach loop. 'follower' is an index. this code looks disgusting but I don't have time to clean it up, soz
		//what's weird though is that every other time I used this kind of loop, it works like a foreach loop
		for(const follower in followers[0].followers){
			console.log("follower");
			//this prints an index
			console.log(follower);
			let newNotif = new Notification();
			newNotif.notified = (followers[0].followers)[follower]._id;
			newNotif.triggeredBy = artistId;
			newNotif.notificationType = "Workshop";
			newNotif.postLink = newWS;
			await newNotif.save();
		}
		res.status(201).send(result);
		
	}
	catch(err){
		console.log(err);
		res.status(400).send("Invalid entries.");
	}
}

//register or unregister
async function toggleRegister(req, res, next) {

	let workshop = await Workshop.find()
									.where('_id').eq(req.body.workshopId).exec();
	let user = await User.find({_id: req.session.userId}).exec();
	let attendees = workshop[0].attendees;
	let userWorkshops = user[0].workshops;
	if(req.body.registerButtonText == "Register"){
		attendees.push(req.session.userId);
		userWorkshops.push(req.body.workshopId);
	}
	else{
		let indexU = attendees.indexOf(req.session.userId);
		attendees.splice(indexU, 1);
		let indexW = userWorkshops.indexOf(req.body.workshopId);
		userWorkshops.splice(indexW, 1);
	}
	const newWS = await Workshop.findByIdAndUpdate(req.body.workshopId, {attendees: attendees});
	await User.findByIdAndUpdate(req.session.userId, {workshops: userWorkshops});

	res.status(200).send(newWS);
}


//authorization function
function auth(req, res, next) {
	//check if there a loggedin property set for the session
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
	next();
}

module.exports = router;