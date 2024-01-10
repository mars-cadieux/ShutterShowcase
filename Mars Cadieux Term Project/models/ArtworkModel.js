const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let artworkSchema = Schema({
	//title of the artwork
	//can contain any type of character, but extra whitespace will be trimmed
	title: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//artist of the artwork, references the 'name' attribute of an artist object 
	//artist: { type: Schema.Types.ObjectId, ref: 'Artist' },
	//I wanted to make this reference the objectID of artists but then I can't add gallery data bc artist name in json file is a string. how can I make this model relational?
	artist: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//year of the artwork 
	year: {
		type: Number,
		min: 1500,  
		max: 2023,
		required: true
	},
	//category of the artwork 
	category: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//medium of the artwork 
	medium: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//description of the artwork 
	description: {
		type: String, 
		required: false,
		maxlength: 1000,
		trim: true
	},
	//url of the poster of the artwork 
	poster: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 500,		//I should probably make this shorter, I just don't want to risk it cutting off a URL right now 
		trim: true
	},
	//likes on the artwork 
	likes: [{ type: Schema.Types.ObjectId, ref: 'Like' }],
	//comments on the artwork 
	comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
});

module.exports = mongoose.model("Artwork", artworkSchema);