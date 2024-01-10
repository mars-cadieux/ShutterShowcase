const mongoose = require("mongoose");
const Schema = mongoose.Schema;


let artistSchema = Schema({
	//userames will be strings between 1-30 characters
	//must consist of only lowercase characters, digits, underscores (_), and periods (.)
	//will be trimmed automatically 
	username: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /[a-z\d_\.]+/,
		trim: true
	},
	//display name of the artist, will appear at top of their page and next to their artworks 
	//meant to be a full name with proper grammar, however digits are allowed as it is common for artists to replace letters with digits in their names (ex. deadmau5)
	//will be trimmed automatically
	name: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /[A-Za-z\d\s]+/,
		trim: true
	},
	//artists can have a 'bio' containing a short introduction about themselves and what kind of art they post. 
	//not required, can contain any types of characters
	//nice to have: create a default by querying their camera, most common category, earliest year
	bio: {
		type: String, 
		required: false,
		maxlength: 500,
		default: "This artist has not entered a biography for themselves yet."
	},
	photo: {
		type: String, 
		required: false,
		maxlength: 500,
		default: "../user.png"
	},
	//array of artworks
	//not required since if a new artist is creating a new account, they will not have any artwork at first
	artworks:[{ type: Schema.Types.ObjectId, ref: 'Artwork' }],
	//array of workshops the artist has hosted or will host
	workshops: [{ type: Schema.Types.ObjectId, ref: 'Workshop' }], 
	//array of users that follow the artist (Consists of both patrons and artists)
	followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model("Artist", artistSchema);