const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let commentSchema = Schema({
	//id of the user who left the comment
	reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
	//username of the user who left the comment
	reviewerUsername: { 
		type: String, 
		required: true
	},
	//artwork that the review was left on
	artwork: { type: Schema.Types.ObjectId, ref: 'Artwork' },
	//comment text
	commentText: {
		type: String, 
		required: true
	}
});

//TODO: validate: comment cannot be empty


module.exports = mongoose.model("Comment", commentSchema);