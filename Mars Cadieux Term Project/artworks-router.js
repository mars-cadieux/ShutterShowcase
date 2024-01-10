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
const Like = require("./models/LikeModel");
const Workshop = require("./models/WorkshopModel");
const Notification = require("./models/NotificationModel");

//authentication will be checked with every request
router.use('/', auth);




/**************************************************************
 * Handling of all requests
 **************************************************************/

//handle get requests to the each artwork's page 
router.get("/:id", loadReviews, sendSingleArtwork); 

//a post request to an artwork id is interpreted as a new comment on that artwork 
router.post("/:id", addComment, loadReviews, sendSingleArtwork);

//delete request to remove a comment from an artwork 
router.delete("/comment", delComment, sendCommentSection);

//a put request to an artwork id is interpreted as a new comment on that artwork 
router.put("/:id", toggleLike, loadReviews, sendCommentSection);




/**************************************************************
 * Helper Functions
 **************************************************************/

async function loadReviews(req, res, next){
	let id = req.params.id;
	res.app.locals.artwork = await Artwork.find({_id: id}).populate('comments').exec();
	res.app.locals.artworkId = id;

	//id of the artist of this artwork, so we can add a link to their page
	res.app.locals.artistIdUsername = await Artist.find({name: res.app.locals.artwork[0].artist}).select('username').exec();

	//variable to keep track of whether the user is on their own profile. this will affect what functionality they have
	let isOwnProfile = false;
	if(req.session.username == res.app.locals.artistIdUsername[0].username){
		isOwnProfile = true;
	}
	res.app.locals.isOwnProfile = isOwnProfile;

	next();
}

function sendSingleArtwork(req, res, next) {
	//for whatever reason, await Artwork.find(...) from previous middleware returns an array with one object, so we take the item at index 0 of this array to get our artwork object
	let currentArtwork = res.app.locals.artwork[0];
	res.render("artwork", {artwork: currentArtwork, artistId: res.app.locals.artistIdUsername[0], isOwnProfile: res.app.locals.isOwnProfile, theme: req.session.theme});
}


async function addComment(req, res, next) {
	let artworkId = req.params.id;
	let newComment = new Comment();
	newComment.commentText = req.body.commentText;

	//again this returns an array with one element so we need to extract this element using temporary storage
	tempReviewer = await User.find({username: req.session.username}).select('_id').exec();
	newComment.reviewerId = tempReviewer[0];
	newComment.reviewerUsername = req.session.username;

	newComment.artwork = artworkId;

	try{
		let result = await newComment.save();
		let currentComments = await Artwork.find({_id: artworkId}).select('comments -_id').exec();
		(currentComments[0]).comments.push(result._id);

		await Artwork.findByIdAndUpdate(artworkId, {comments: (currentComments[0]).comments});
	}
	catch(err){
		res.status(400).send("Comment cannot be empty");
		return;
	}
	next();
}

async function toggleLike(req, res, next){
	let artworkId = req.params.id;

	let userID = await User.find().where("username").eq(req.session.username).select("_id").exec();
	let currentLikes = await Artwork.find({_id: artworkId}).select('likes -_id').exec();
	let potentialLike = await Like.find()
									.where("likedby").eq(userID[0])
									.where("artwork").eq(artworkId)
									.exec();

	//is there a like by this patron on this artist?
	//you know the drill, .find() returns an array so we grab the first item
	if(potentialLike[0]){
		//the patron has liked this artwork, so they are unliking it. remove the like and from the artwork and from the Likes collection
		let index = (currentLikes[0]).likes.indexOf(potentialLike._id);
		(currentLikes[0]).likes.splice(index, 1);

		await Artwork.findByIdAndUpdate(artworkId, {likes: (currentLikes[0]).likes});
		await Like.findByIdAndDelete((potentialLike[0])._id);

	}
	else{
		//add a like to this artwork
		let newLike = new Like();
		newLike.likedby = userID[0];
		newLike.artwork = artworkId;
		let result = await newLike.save();
		(currentLikes[0]).likes.push(result._id);

	await Artwork.findByIdAndUpdate(artworkId, {likes: (currentLikes[0]).likes});

	}
	next();
}

//render our partial with comments section rather than whole page
async function sendCommentSection(req, res, next) {
	//for whatever reason, await Artwork.find(...) from previous middleware returns an array with one object, so we take the item at index 0 of this array to get our artwork object
	res.app.locals.artwork = await Artwork.find({_id: res.app.locals.artworkId}).populate('comments').exec();
	let currentArtwork = res.app.locals.artwork[0];

	res.render("../partials/commentsection", {artwork: currentArtwork});
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
	next();
}

//authorization function
function auth(req, res, next) {
	//check if there is a loggedin property set for the session. if not, redirect to login page
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
	next();
}

module.exports = router;