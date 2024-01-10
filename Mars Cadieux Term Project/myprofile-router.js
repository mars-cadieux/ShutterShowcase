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
const Like = require("./models/LikeModel");
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

//handle get requests to the /myprofile page 
//this shows all artworks in no particular order
router.get("/", sendProfile); 

//delete request to remove a comment
router.delete('/comment', delComment);

//delete request to remove a like
router.delete('/like', removeLike);

//PUT request to unfollow an artist
//unfollowing does not delete anything, simply updates the artist's followers array
router.put('/follow', removeFollow);

//PUT request to change account type
router.put('/change-account-type', changeAccType);

//POST request to upload first artwork and upgrade to artist
router.post('/change-account-type/newpost', upgradeToArtist);




/**************************************************************
 * Helper Functions
 **************************************************************/

//authorization function
function auth(req, res, next) {
	//check if theres a loggedin property set for the session
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
	next();
}

//load the patron's profile data
async function sendProfile(req, res, next) {

	let user = await User.find()
							.where("username").eq(req.session.username)
							.populate('following')
							.exec();

	let userLikes = await Like.find()
								.where("likedby").eq(user[0]._id)
								.populate("artwork")
								.exec();

	let userComments = await Comment.find()
										.where("reviewerId").eq(user[0]._id)
										.populate("artwork")
										.exec();

	let userFollowers = await Artist.find()
										.where("username").eq(req.session.username)
										.populate("followers")
										.exec();

	let userNotifs = await Notification.find()
											.where("notified").eq(user[0]._id)
											.populate('triggeredBy')
											.exec();

	//the user is or was an artist, grab their followers (could be an empty array)									
	if(userFollowers[0]){
		res.render("myprofile", {user: user[0], following: user[0].following, likes: userLikes, comments: userComments, followers: userFollowers[0].followers, notifications: userNotifs, theme: req.session.theme});
	}
	//the user has never been an artist, userFollowers[0] will be undefined, simply send an empty array								
	else{
		res.render("myprofile", {user: user[0], following: user[0].following, likes: userLikes, comments: userComments, followers: [], notifications: userNotifs, theme: req.session.theme});
	}

	

}

//delete the specified comment
//note that if the user posts two comments with the same text on the same artwork, it will delete one of the two comments at random. ideally I'd add more metadata like a timestamp to differentiate the two but I don't have time
async function delComment(req, res, next) {
	
	let artworkId = req.body.artwork;
	let commentText = req.body.comment;

	let result = await Comment.findOneAndDelete()
								.where("reviewerUsername").eq(req.session.username)
								.where("artwork").eq(artworkId)
								.where("commentText").eq(commentText);
	
	let currentComments = await Artwork.find({_id: artworkId}).select('comments -_id').exec();
	let index = (currentComments[0]).comments.indexOf(result._id);
	(currentComments[0]).comments.splice(index, 1);

	await Artwork.findByIdAndUpdate(artworkId, {comments: currentComments[0].comments});

	res.app.locals.artworkId = artworkId;
	res.status(204).send();
}

async function removeLike(req, res, next){
	let artworkId = req.body.artwork;

	let userID = await User.find().where("username").eq(req.session.username).select("_id").exec();
	let currentLikes = await Artwork.find({_id: artworkId}).select('likes -_id').exec();
	let userLike = await Like.find()
									.where("likedby").eq(userID[0])
									.where("artwork").eq(artworkId)
									.exec();

	let index = (currentLikes[0]).likes.indexOf(userLike._id);
	(currentLikes[0]).likes.splice(index, 1);

	await Artwork.findByIdAndUpdate(artworkId, {likes: (currentLikes[0]).likes});
	await Like.findByIdAndDelete((userLike[0])._id);

	res.status(204).send();
}

async function removeFollow(req, res, next){
	let artistId = req.body.artist;

	let userID = await User.find().where("username").eq(req.session.username).select("_id").exec();
	let userFollowing = await User.find({_id: userID[0]}).select('following -_id').exec();
	let artistFollowers = await Artist.find({_id: artistId}).select('followers -_id').exec();

	//the patron already follows this artist, so they are unfollowing them 
	let index = (userFollowing[0]).following.indexOf(artistId);
	(userFollowing[0]).following.splice(index, 1);

	await User.findByIdAndUpdate(userID[0], {following: (userFollowing[0]).following});

	index = (artistFollowers[0]).followers.indexOf(userID[0]);
	(artistFollowers[0]).followers.splice(index, 1);

	await Artist.findByIdAndUpdate(artistId, {followers: (artistFollowers[0]).followers});
	
	res.status(204).send();
}

async function changeAccType(req, res, next){
	let user = await User.find({_id: req.session.userId}).exec();
	if(req.body.accReq == "patronSlider"){
		//they are requesting to become a patron. Have they already been a patron? If so, no need to create a new Patron object
		let potentialPatron = await Patron.find()
											.where("username").eq(req.session.username).exec();
		//patron with this username exists
		if(potentialPatron[0]){
			try{
				req.session.loginType = 'patron';
				await User.findByIdAndUpdate(user[0]._id, {userType: 'patron'});
				res.status(204).send();
			}
			catch(err){
				console.log(err);
				res.status(500).send();
			}
		}
		//patron with this username does not exist, let's make one
		else {
			try {
				let newPatron = new Patron();
				newPatron.username = req.session.username;
				newPatron.workshops = [];
				await newPatron.save();
				req.session.loginType = 'patron';
				await User.findByIdAndUpdate(user[0]._id, {userType: 'patron'});
				res.status(204).send();
			}
			catch(err){
				console.log(err);
				res.status(500).send();
			}
		}
	}
	if(req.body.accReq == "artistSlider"){
		//they are requesting to become an artist. Have they already been an artist? If so, no need to create a new Artist object
		let potentialArtist = await Artist.find()
											.where("username").eq(req.session.username).exec();
		//artist with this username exists
		if(potentialArtist[0]){
			try{
				req.session.loginType = 'artist';
				await User.findByIdAndUpdate(user[0]._id, {userType: 'artist'});
				res.status(204).send();
			}
			catch(err){
				console.log(err);
				res.status(500).send();
			}
		}
		//artist with this username does not exist. Send back 202 to indicate we have received the request, but more work is required on their end.
		else {
			res.status(202).send();
		}
	}
}

//upgrade patron account to artist account
async function upgradeToArtist(req, res, next) {
	let artistName = req.body.artistName; 

	//create new artist object and save it to the db
	let artist = new Artist();
	artist.username = req.session.username;
	artist.name = artistName;
	artist.artworks = [];
	artist.workshops = [];
	artist.followers = [];

	const newArtist = await artist.save();

	//now, create new artwork object with the data sent in the form
	let artworkData = req.body;
	console.log(artworkData);

	let art = new Artwork();
	art.title = (artworkData)["title"];
	art.artist = newArtist.name;
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
		const newArtId = result._id;
		let artistArt = newArtist.artworks;
		artistArt.push(newArtId);

		//add this new artowrk's id to the artist's artworks array
		await Artist.findByIdAndUpdate(newArtist._id, {artworks: artistArt});

		//finally, update our user object's userType to artist and change the session login type to artist
		let user = await User.find({_id: req.session.userId}).exec();
		req.session.loginType = 'artist';
		await User.findByIdAndUpdate(user[0]._id, {userType: 'artist'});
		res.status(201).send(newArtist._id);
		
	}
	catch(err){
		console.log(err);
		res.status(400).send("Invalid entries.");
	}
}


module.exports = router;