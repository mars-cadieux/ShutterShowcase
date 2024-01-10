const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let patronSchema = Schema({
	//Userames will be strings between 1-30 characters
	//must consist of only lowercase characters, digits, underscores (_), and periods (.)
	//Will be trimmed automatically 
	username: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match:/[a-z\d_\.]+/,
		trim: true
	},
	//I think for now I won't use likes and comments, will query Likes and Comments for username
	//array of likes
	//likes:  [{ type: Schema.Types.ObjectId, ref: 'Like' }], 
	//array of comments
	//comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }], 
	// //array of artists they follow
	// following: [{ type: Schema.Types.ObjectId, ref: 'Artist' }], 
	//array of workshops they have or will attend
	workshops: [{ type: Schema.Types.ObjectId, ref: 'Workshop' }], 
});

module.exports = mongoose.model("Patron", patronSchema);