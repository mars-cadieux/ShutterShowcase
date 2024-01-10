const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let likeSchema = Schema({
	//username of the user who left the like
	likedby: { type: Schema.Types.ObjectId, ref: 'User' },
	//artwork that the like was left on
	artwork: { type: Schema.Types.ObjectId, ref: 'Artwork' },
});


module.exports = mongoose.model("Like", likeSchema);