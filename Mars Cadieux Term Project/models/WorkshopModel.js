const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let workshopSchema = Schema({
	//title of the workshop
	//can contain any type of character, but extra whitespace will be trimmed
	title: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//artist that hosts the workshop 
	host: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
	//TODO: day/time validation
	//day
	day: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	time: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 50,
		trim: true
	},
	//array of users who attend the workshop 
	attendees: [{type: Schema.Types.ObjectId, ref: 'User'}]
	//nice to have: date and time 
	//not implementing this right now because Mongoose supposedly does not persist modifications with methods like setMonth() so things may get tricky 
	
});

module.exports = mongoose.model("Workshop", workshopSchema);