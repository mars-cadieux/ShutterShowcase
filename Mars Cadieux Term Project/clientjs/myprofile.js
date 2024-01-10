/**************************************************************
 * 
 *     Event listeners for 'delete comment' buttons
 * 
 **************************************************************/

let deleteButtons = Array.from(document.getElementsByClassName("deleteComment"));
console.log(deleteButtons);

deleteButtons.forEach(button => {
	button.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 204){
				window.location.reload();
			}
		}
		let segments = (button.id).split('/');
		console.log(segments);
		let data = {"artwork": segments[1], "comment": segments[0] };
		console.log(data);
		xhttp.open("DELETE", '/myprofile/comment');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
	});
});




/**************************************************************
 * 
 *     Event listeners for 'unlike' buttons
 * 
 **************************************************************/

let unlikeButtons = Array.from(document.getElementsByClassName("unlike"));
console.log(unlikeButtons);

unlikeButtons.forEach(button => {
	button.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 204){
				window.location.reload();
			}
		}
		let data = {"artwork": button.id};
		console.log(data);
		xhttp.open("DELETE", '/myprofile/like');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
	});
});





/**************************************************************
 * 
 *     Event listeners for 'unfollow' buttons
 * 
 **************************************************************/

let unfollowButtons = Array.from(document.getElementsByClassName("unfollow"));
console.log(unfollowButtons);

unfollowButtons.forEach(button => {
	button.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 204){
				window.location.reload();
			}
		}
		let data = {"artist": button.id};
		console.log(data);
		xhttp.open("PUT", '/myprofile/follow');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
	});
});





/**************************************************************
 * 
 *     Event listeners for the slider to change account type
 * 
 **************************************************************/

let selectedSliderTemp = Array.from(document.getElementsByClassName('selected'));
let selectedSlider = selectedSliderTemp[0];

selectedSlider.style.backgroundColor = 'var(--selSlider)';

let unselectedSliderTemp = Array.from(document.getElementsByClassName('unselected'));
let unselectedSlider = unselectedSliderTemp[0];

unselectedSlider.style.backgroundColor = 'var(--inactvTab)';
unselectedSlider.onmouseover = setHover();

function setHover(){
	unselectedSlider.style.cursor = "pointer";
}

unselectedSlider.addEventListener('click', function() {
	xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 204){
				if(unselectedSlider.id == 'patronSlider'){
					alert("You have successfully changed to a patron account.");
				}
				else if(unselectedSlider.id == 'artistSlider'){
					alert("You have successfully changed to an photographer account.");
				}
				window.location.reload();
			}
			//response code of 202 means the user is requesting to become an artist for the first time, so they will now be prompted to upload their first artwork
			if(this.readyState == 4 && this.status == 202){
				alert("We have received your request to upgrade to an photographer account. To continue, please provide your photographer name and upload your first photo.");
				displayModal();
				
			}
		}
		let data = {accReq: unselectedSlider.id};

		xhttp.open("PUT", '/myprofile/change-account-type');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
});




/**************************************************************
 * 
 *     Modal to add first artwork
 * 
 **************************************************************/

let header = document.getElementById("header");

let postModal = document.getElementById("newPostModal");
let closePost = document.getElementById("closePost");


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

function displayModal() {
	postModal.style.display = "block";
	header.style.zIndex = 0;
}




/**************************************************************
 * 
 *     POST request to upload artwork
 * 
 **************************************************************/

//TODO: better validation
let uploadPostButton = document.getElementById("uploadPost");

if(uploadPostButton){
	uploadPostButton.addEventListener('click', function() {
		if(validateArtworkInput()){
			xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if(this.readyState == 4 && this.status == 201){
					alert("Your artwork was successfully uploaded!");
					let responseobj = this.responseText;
					//response obj is id of new artist object. it is in quotes so the first and last char need to be trimmed off. navigate to the user's new artist page
					window.location.href = "http://localhost:3000/artists/" + responseobj.substring(1, responseobj.length -1);
				}
				else if(this.readyState == 4 && this.status == 400){
					alert("Invalid entries.");
				}
			}

			let artistName = (document.getElementById("artistName")).value;
			let newPostTitle = (document.getElementById("newPostTitle")).value;
			let newPostYear = (document.getElementById("newPostYear")).value;
			let newPostCategory = (document.getElementById("newPostCategory")).value;
			let newPostMedium = (document.getElementById("newPostMedium")).value;
			let newPostDescription = (document.getElementById("newPostDescription")).value;
			let newPostPoster = (document.getElementById("newPostPoster")).value;

			let postData = {"artistName": artistName, "title": newPostTitle, "year": newPostYear, "category": newPostCategory, "medium": newPostMedium, "description": newPostDescription, "poster": newPostPoster};
			console.log(postData);

			//TODO: input validation (maybe on server side?)
			xhttp.open("POST", '/myprofile/change-account-type/newpost');
			xhttp.setRequestHeader("Content-Type", "application/json");
			xhttp.send(JSON.stringify(postData));
		}
	});
}

//check for errors in input fields 
function validateArtworkInput() {
	let artistName = (document.getElementById("artistName")).value;
	let newPostTitle = (document.getElementById("newPostTitle")).value;
	let newPostYear = (document.getElementById("newPostYear")).value;
	let newPostCategory = (document.getElementById("newPostCategory")).value;
	let newPostMedium = (document.getElementById("newPostMedium")).value;
	let newPostPoster = (document.getElementById("newPostPoster")).value;

	//check for empty inputs
	if(!artistName){
		alert("Please provide your photographer name.");
		return false;
	}
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
	else if(parseInt(newPostYear) > 2023 || parseInt(newPostYear) < 0){
		alert("Invalid year.");
		return false;
	}

	return true;
}