const mongoose = require("mongoose");
const Schema = mongoose.Schema;


let notificationSchema = Schema({

	notified: { type: Schema.Types.ObjectId, ref: 'User' },

	triggeredBy: { type: Schema.Types.ObjectId, ref: 'Artist' },
	//value will be "Post" or "Workshop"
	notificationType: {
		type: String, 
		required: true
	},
	//id of the post (photo or workshop) that triggered the notification
	postLink: {
		type: String,
		required: true
	}
});
//TODO: validation

module.exports = mongoose.model("Notification", notificationSchema);