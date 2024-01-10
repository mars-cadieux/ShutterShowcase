const express = require('express');
//const session = require('express-session');
const pug = require('pug');
const fs = require('fs');
//const mc = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const User = require("./models/UserModel");
const Artist = require("./models/ArtistModel");
const Artwork = require("./models/ArtworkModel");
const Patron = require("./models/PatronModel");
const Like = require("./models/LikeModel");
const Comment = require("./models/CommentModel");
const Workshop = require("./models/WorkshopModel");
const Notification = require("./models/NotificationModel");

let db;
let app = express();

const session = require('express-session');
const MongoDBGallery = require('connect-mongodb-session')(session);

const gallery = new MongoDBGallery({
	uri: 'mongodb://127.0.0.1:27017/ShutterShowcase',
	collection: 'sessiondata'
});



const baseURL = "http://localhost:3000";
const artistsURL = "/artists/";
const artworksURL = "/artworks/"; 
const browseURL = "/browse/"; 
const myprofileURL = "/myprofile/"; 




/**************************************************************
 * Server Setup 
 **************************************************************/

//routers
const artistsRouter = require("./artists-router");
const artworksRouter = require("./artworks-router");
const browserouter = require("./browse-router");
const myprofileRouter = require("./myprofile-router");

//Body parser
app.use(express.urlencoded({extended: true}));
app.use(express.json());

//session ID handling
app.use(session({
	secret: 'f696003dc681653e603a83b2ae0ba982',
	cookie: {maxAge:3600000},  //the cookie will expire in 1 hour
	resave: true,
	saveUninitialized: true,
	store: gallery
}));

//middleware to inlude the login type in all requests, so we don't need to pass it to our templates every time we render
app.use((req, res, next) => {
	res.locals.loginType = req.session.loginType;
	res.locals.username = req.session.username;
	next();
});

//ensures requests from within the same domain won't get blocked
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//some requests for external images were being blocked, this allows requests from different domains to come through
app.use((req, res, next) => {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

//set view engine to pug so server knows how to render templates
app.set("views", "views/pages");
app.set("view engine", "pug");




/**************************************************************
 * Static File Handling 
 **************************************************************/

//specify directories to search in when serving static files
app.use(express.static("images"));
app.use(express.static("style"));
app.use(express.static("clientjs"));




/**************************************************************
 * Routing and Handling of all Requests
 **************************************************************/

//Mount the artistsRouter router to the path /artists
//all requests to /artists or /artists/ID# will get redirected to this router
app.use(artistsURL, artistsRouter);
app.use(artworksURL, artworksRouter);
app.use(browseURL, browserouter);
app.use(myprofileURL, myprofileRouter);



//get request for 'base' URL redirects to login if not logged in, and redirects to home if logged in page
app.get('/', (req, res) => { 
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
    else{
		res.redirect("/home");
	}
});

//get request for login page
app.get('/login', (req, res) => { 
	if(req.session.theme){
		res.render("login", {theme: req.session.theme});
	}
	else{
		res.render("login", {theme: 'styles.css'});
	}
    
});

//send POST request to /login route to login
app.post('/login', login);	

//send POST request to /register route to register
app.post('/register', register);	

//send GET request to /logout route to logout
app.get("/logout", logout);     

//get request for home page
app.get('/home', (req, res) => { 
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
    res.render("home");
});

//get request for a workshop's page
app.get('/workshops/:id', auth, sendSingleWorkshop);

//put request to change the theme
app.put('/theme', auth, changeTheme);




/**************************************************************
 * Helper Functions 
 **************************************************************/

//authorization function
function auth(req, res, next) {
	//check if there is a loggedin property set for the session
	if (!req.session.loggedin) {
		res.status(401).redirect('/login');
		return;
	}
	next();
}

async function login(req, res, next) {
	
	if (req.session.loggedin) {
		if(req.body.username != req.session.username){
			res.status(400).send("Another user is already logged into this session."); 
			return;
		}
		res.status(200).send("Already logged in.");
		return;
	}


	let username = req.body.username;
	let password = req.body.password;
	let loginType = req.body.loginType;

	console.log("Logging in with credentials:");
	console.log("Username: " + req.body.username);
	console.log("Password: " + req.body.password);

	//check if the username exists
	let user = await User.find()
								.where("username").eq(username)
								.exec();
	//if the query for the username returns an empty array
	if(!user[0]){
		res.status(404).send("User not found."); 
		return;
	}
	//if username exists but login type is incorrect
	else if(user[0].userType != loginType){
		res.status(400).send("Incorrect login type for this account."); 
		return;
	}
	//If username exists but password is incorrect 
	else if(user[0].password != password){
		res.status(401).send("Incorrect password."); 
		return;
	}
	//made it past all checkpoints; password and login type are both correct for this username
	else{
		try{
			req.session.loggedin = true; // now that particular user session has loggedin value, and it is set to true 
			req.session.username = username; //we keep track of what user this session belongs to
			req.session.loginType = loginType; //we keep track of whether the user is a patron or an artist
			//keep track of user ID so we don't have to query the db as often
			req.session.userId = user[0]._id;
			req.session.theme = 'styles.css'; //set style to dark mode
			req.session.save(function(err) {
				if(err){
					throw new Error(err);
				}
				res.status(200).send("Logged in");
			});
			return;
		}
		catch(err){
			res.status(500).send("An error occurred while trying to sign you in. Please try again.");
		}
	}
}

//register
async function register(req, res, next) {
	if (req.session.loggedin) {
		res.status(401).send("Another user is already logged into this session.");
		return;
	}

	let username = req.body.username;
	let password = req.body.password;

	console.log("Attempting to register with credentials:");
	console.log("Username: " + req.body.username);
	console.log("Password: " + req.body.password);

	let user = await User.find()
							.where("username").eq(username)
							.exec();
	if(user[0]){
		res.status(400).send("Username already exists");
		return;
	} 
	else if(!req.body.password){
		res.status(401).send();
		return;
	}
	else {
		let newUser = new User();
		newUser.username = username;
		newUser.password = password;
		newUser.userType = "patron";
		try {
			newUser.save();
			res.status(201).send();
		}
		catch(err){
			console.log(err);
		}
	}
}

//logout function
function logout(req, res, next) {
	if (req.session.loggedin) {
		req.session.loggedin = false;
		req.session.username = undefined;
		req.session.save(function(err) {
			if(err){
				throw new Error(err);
			}
			res.redirect('/login');
		});
	} else {
		res.status(200).send("You cannot log out because you aren't logged in.");
	}
}

//load details of a workshop and render page 
async function sendSingleWorkshop(req, res, next) {

	let id = req.params.id;
	res.app.locals.workshop = await Workshop.find({_id: id}).populate('attendees').exec();
	console.log('workshop from sendsingleworkshop');
	console.log(res.app.locals.workshop);

	res.app.locals.artist = await Artist.find({_id: res.app.locals.workshop[0].host}).exec();
	console.log('artist');
	console.log(res.app.locals.artist);
	res.render("workshop", {workshop: res.app.locals.workshop[0], artist: res.app.locals.artist[0], theme: req.session.theme});
}

//change the theme (css sheet to be used) 
function changeTheme(req, res, next) {
	let theme = req.body.theme;
	if(theme == 'Cute'){
		req.session.theme = 'styles-light.css';
		res.status(200).send();
	}
	else if(theme == 'Dark'){
		req.session.theme = 'styles.css';
		res.status(200).send();
	}
	else{
		res.status(400).send("Invalid theme selection");
	}

}


/**************************************************************
 * Start listening
 **************************************************************/

async function run() {
	try {
		await mongoose.connect('mongodb://127.0.0.1/ShutterShowcase');
		db = mongoose.connection;
	} 
	catch(err) {
		console.log(err);
	}
	finally {
		console.log("Server running on Port 3000");
		app.listen(3000); 
	}
}
// Run the function and handle any errors
run().catch(console.dir);