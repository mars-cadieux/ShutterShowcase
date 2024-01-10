/**************************************************************
 * 
 *     Event listener for follow button
 * 
 **************************************************************/

let followButton = document.getElementById("followButton");

if(followButton){
	followButton.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200){
				window.location.reload();
			}
		}
		let url = window.location.href;

		xhttp.open("PUT", url);
		xhttp.setRequestHeader("Content-Type", "text/html");
		xhttp.send();
	});
}




/**************************************************************
 * 
 *     Toggle between photos and workshops
 * 
 **************************************************************/

let photosTab = document.getElementById("photosTab");
let workshopsTab = document.getElementById("workshopsTab");
let photosDiv = document.getElementById("artistPhotos");
let workshopsDiv = document.getElementById("artistWorkshops");

//grab the theme, affects whether we add neon pink to the top of tabs
let theme = (document.getElementById("themeText")).value;

photosTab.addEventListener('click', function() {
	photosTab.style.backgroundColor = 'var(--actvTab)';
	//dark mode = styles.css, cute mode = styles-light.css
	if(theme=="styles.css"){
		photosTab.style.borderTop = '2px solid var(--neon)';
	}
	else{
		photosTab.style.borderTop = '2px solid var(--actvTab)';
	}

	workshopsTab.style.backgroundColor = 'var(--inactvTab)';
	workshopsTab.style.borderTop = '2px solid var(--inactvTab)';

	photosDiv.style.display = "grid";
	workshopsDiv.style.display = "none";
});

workshopsTab.addEventListener('click', function() {
	workshopsTab.style.backgroundColor = 'var(--actvTab)';
	//dark mode = styles.css, cute mode = styles-light.css
	if(theme=="styles.css"){
		workshopsTab.style.borderTop = '2px solid var(--neon)';
	}
	else{
		workshopsTab.style.borderTop = '2px solid var(--actvTab)';
	}

	photosTab.style.backgroundColor = 'var(--inactvTab)';
	photosTab.style.borderTop = '2px solid var(--inactvTab)';

	photosDiv.style.display = "none";
	workshopsDiv.style.display = "grid";
});




/**************************************************************
 * 
 *     Modal to add a new post
 * 
 **************************************************************/

let header = document.getElementById("header");

let postModal = document.getElementById("newPostModal");
let newPostButton = document.getElementById("newPost");
let closePost = document.getElementById("closePost");

if(newPostButton){
	newPostButton.onclick = function() {
		postModal.style.display = "block";
		header.style.zIndex = 0;
	}

	closePost.onclick = function() {
		postModal.style.display = "none";
		header.style.zIndex = 10;
	}

	window.onclick = function(event) {
		if (event.target == postModal) {
			postModal.style.display = "none";
			header.style.zIndex = 10;
		}
	}
}




/**************************************************************
 * 
 *     Modal to add a new workshop
 * 
 **************************************************************/

let workshopModal = document.getElementById("newWorkshopModal");
let newWSButton = document.getElementById("newWorkshop");
let closeWS = document.getElementById("closeWS");

if(newWSButton){
	newWSButton.onclick = function() {
		workshopModal.style.display = "block";
		header.style.zIndex = 0;
	}

	closeWS.onclick = function() {
		workshopModal.style.display = "none";
		header.style.zIndex = 10;
	}

	window.onclick = function(event) {
		if (event.target == workshopModal) {
			workshopModal.style.display = "none";
			header.style.zIndex = 10;
		}
	}
}




/**************************************************************
 * 
 *     POST request to upload new artwork 
 * 
 **************************************************************/

let uploadPostButton = document.getElementById("uploadPost");

if(uploadPostButton){
	uploadPostButton.addEventListener('click', function() {
		//check for errors in input fields before sending the request
		if(validateArtworkInput()){
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if(this.readyState == 4 && this.status == 201){
					alert("Your artwork was successfully uploaded!");
					window.location.reload();
				}
				else if(this.readyState == 4 && this.status == 400){
					//TODO: better error handling
					alert("Invalid entries.");
					window.location.reload();
				}
			}
			let url = new URL(window.location.href);
			let urlString = url.toString();
			let artistIdArray = (urlString.split('/'));
			let artistId = artistIdArray[artistIdArray.length - 1];

			let newPostTitle = (document.getElementById("newPostTitle")).value;
			console.log(newPostTitle);
			let newPostYear = (document.getElementById("newPostYear")).value;
			let newPostCategory = (document.getElementById("newPostCategory")).value;
			let newPostMedium = (document.getElementById("newPostMedium")).value;
			let newPostDescription = (document.getElementById("newPostDescription")).value;
			let newPostPoster = (document.getElementById("newPostPoster")).value;

			let postData = {"title": newPostTitle, "year": newPostYear, "category": newPostCategory, "medium": newPostMedium, "description": newPostDescription, "poster": newPostPoster};
			console.log(postData);

			//TODO: input validation (maybe on server side?)
			xhttp.open("POST", `/artists/newpost/${artistId}`);
			// xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.send(JSON.stringify(postData));
		}
	});
}

//check for errors in input fields 
function validateArtworkInput() {
	let newPostTitle = (document.getElementById("newPostTitle")).value;
	let newPostYear = (document.getElementById("newPostYear")).value;
	let newPostCategory = (document.getElementById("newPostCategory")).value;
	let newPostMedium = (document.getElementById("newPostMedium")).value;
	let newPostPoster = (document.getElementById("newPostPoster")).value;

	//check for empty inputs
	if(!newPostTitle){
		alert("Please enter a title.");
		return false;
	}
	else if(!newPostYear){
		alert("Please enter a year.");
		return false;
	}
	else if(!newPostCategory){
		alert("Please enter a category.");
		return false;
	}
	else if(!newPostMedium){
		alert("Please enter a medium.");
		return false;
	}
	else if(!newPostPoster){
		alert("Please enter a poster.");
		return false;
	}

	//check for invalid year
	if(!parseInt(newPostYear)){
		alert("Year must be a number.");
		return false;
	}
	else if(parseInt(newPostYear) > 2023 || parseInt(newPostYear) < 1500){
		alert("Invalid year.");
		return false;
	}

	return true;
}


/**************************************************************
 * 
 *     POST request to upload new workshop 
 * 
 **************************************************************/

let uploadWSButton = document.getElementById("uploadWorkshop");

if(uploadWSButton){
	uploadWSButton.addEventListener('click', function() {
		//check for errors in input fields before sending the request
		if(validateWSInput()){
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if(this.readyState == 4 && this.status == 201){
					alert("Your workshop was successfully added!");
					window.location.reload();
				}
				else if(this.readyState == 4 && this.status == 400){
					alert("Invalid entries.");
				}
			}

			let newWSTitle = (document.getElementById("newWorkshopTitle")).value;
			let newWSDay = (document.getElementById("newWorkshopDay")).value;
			let newWSTime = (document.getElementById("newWorkshopTime")).value;

			let url = new URL(window.location.href);
			let urlString = url.toString();
			let artistIdArray = (urlString.split('/'));
			let artistId = artistIdArray[artistIdArray.length - 1];

			let postData = {"title": newWSTitle, "day": newWSDay, "time": newWSTime};
			console.log(postData);

			//TODO: input validation (maybe on server side?)
			xhttp.open("POST", `/artists/newworkshop/${artistId}`);
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.send(JSON.stringify(postData));
		}
	});
}


//check for errors in input fields before sending the request
function validateWSInput() {
	let newWSTitle = (document.getElementById("newWorkshopTitle")).value;
	let newWSDay = (document.getElementById("newWorkshopDay")).value;
	let newWSTime = (document.getElementById("newWorkshopTime")).value;

	//check for empty inputs
	if(!newWSTitle){
		alert("Please enter a title.");
		return false;
	}
	else if(!newWSDay){
		alert("Please enter a day.");
		return false;
	}
	else if(!newWSTime){
		alert("Please enter a time.");
		return false;
	}

	//check for invalid date
	let today = new Date();
	let inputDate = new Date(newWSDay);
	if(inputDate < today){
		alert("Workshop cannot occur on or before today.");
		return false;
	}

	return true;
}



/**************************************************************
 * 
 *     PUT request to register/unregister from workshops
 * 
 **************************************************************/

let registerButtons = Array.from(document.getElementsByClassName("registerButton"));

if(registerButtons){
	registerButtons.forEach(button => {
		button.addEventListener('click', function() {
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if(this.readyState == 4 && this.status == 200){
					if(button.value == 'Register') {
						alert("You have successfully been registered!");
					}
					else if(button.value == 'Unregister') {
						alert("You have successfully been unregistered.");
					}
					
					window.location.reload();
				}
				else if(this.readyState == 4 && this.status == 500){
					//TODO: better error handling
					alert("There was an error in registering you for this workshop. Please try again.");
				}
			}
			let postData = {"workshopId": button.id, "registerButtonText": button.value};
			console.log(postData);
	
			xhttp.open("PUT", `/artists/workshops`);
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.send(JSON.stringify(postData));
		});
	});
}