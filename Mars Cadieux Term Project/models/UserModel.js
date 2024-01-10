const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
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
	//passwords will be strings between 1-30 characters
	//nice to have: change min to 8. this will require more complex error handling on client-side
	//passwords cannot contain whitespace but may contain any other type of character
	password: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /\S+/
	},
	//usertype is either 'patron' or 'artist'
	userType: {
		type: String, 
		required: true
	},
	//array of artists they follow. both patrons and artists can follow artists so we're keeping this information here 
	following: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
	//array of workshops they have or will attend 
	workshops: [{ type: Schema.Types.ObjectId, ref: 'Workshop' }]
	//array of notifications
	//notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
});

module.exports = mongoose.model("User", userSchema);