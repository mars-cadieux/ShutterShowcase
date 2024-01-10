const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Artist = require("./models/ArtistModel");
const Artwork = require("./models/ArtworkModel");
const Patron = require("./models/PatronModel");
const Review = require("./models/CommentModel");
const Workshop = require("./models/WorkshopModel");
const Notification = require("./models/NotificationModel");



/**************************************************************
 * Objects, Arrays, Data
 **************************************************************/

let artworkData = [];
let artworks = [];


//initial set of patron accounts
let patrons = [
	{username: "fox", password: "123", userType: 'patron' },
	{username: "cat", password: "meow", userType: 'patron' }
];




/**************************************************************
 * Rading of JSON Files
 **************************************************************/

//read in gallery data
fs.readdir("./gallery", function(err, files){

    try {
        let gal = require("./gallery/photogallery.json");
        artworkData = gal;
		//console.log(artworkData);
		
		//translate this data into an object that follows the 'Artwork' schema
		for(let i=0; i<artworkData.length; i++){
			let art = new Artwork();
			art.title = (artworkData[i])["Title"];
			art.artist = (artworkData[i])["Artist"];
			art.year = (artworkData[i])["Year"];
			art.category = (artworkData[i])["Category"];
			art.medium = (artworkData[i])["Medium"];
			art.description = (artworkData[i])["Description"];
			art.poster = (artworkData[i])["Poster"];
			art.likes = [];
			art.comments = [];
			artworks.push(art);
		}
		//console.log(artworks);
    }
    //if we've thrown an error or if there was an error in reading JSON files, do nothing and print this error to the console
    catch(e){
        console.log(e);
    }
});




/**************************************************************
 * Start building the DB
 **************************************************************/

mongoose.connect('mongodb://127.0.0.1/ShutterShowcase');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {

	try{
		await mongoose.connection.dropDatabase();
		console.log("Dropped database. Starting re-creation.");

		//add all artworks to the db. we use await so we can simulate syncronous workflow, because we will want to query the db after this
		for (const artwork of artworks){
			const result = await artwork.save();
			console.log(result); //debugging 
		}
		console.log("All artworks saved.");

		//find all of the distinct artists for these artworks and generate user profiles + artist objects for each
		const artworksCollection = db.collection("artworks");
		let artists = await artworksCollection.distinct("artist");

		//for each artist, create a artist object (for loading their page) and user object with a password 
		//all of our inital artists will have the super secure password 'artist'
		let artistPassword = "artist";
		let artistAccType = "artist";

		for (const artistName of artists){
			let artworkIds = await Artwork.find().where("artist").eq(artistName).select("_id");
			console.log(artworkIds); //debugging   

			//we will generate a username for each of our initial artists by converting their name to lowercase and removing all spaces
			let artistNameLower = artistName.toLowerCase();
			let artistUsername = artistNameLower.replace(/\s+/g, '');

			let newArtist = new Artist();
			newArtist.username = artistUsername;
			newArtist.name = artistName;
			newArtist.artworks = artworkIds;
			newArtist.workshops =  [];
			newArtist.followers = [];

			await newArtist.save();

			let newUser = new User();
			newUser.username = artistUsername;
			newUser.password = artistPassword;
			newUser.userType = artistAccType;
			newUser.following = [];
			newUser.workshops = [];

			await newUser.save();
		}
		console.log("All artists saved.");

		//finally, make user + patron accounts for our two initial patrons
		for(let i=0; i<patrons.length; i++){
			let newUser = new User();
			let newPatron = new Patron();

			newUser.username = patrons[i].username;
			newUser.password = patrons[i].password;
			newUser.userType = patrons[i].userType;
			newUser.following = [];
			newUser.workshops = [];
			await newUser.save();

			newPatron.username = patrons[i].username;
			newPatron.workshops = [];
			await newPatron.save();
		}
		console.log("All patrons saved.");
	}
	catch(err){
		console.log(err);
	}
	
	await mongoose.disconnect();
});

