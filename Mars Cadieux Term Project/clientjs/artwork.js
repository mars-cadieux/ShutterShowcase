let likeButton = document.getElementById('favourite');

let isOwnProfile = document.getElementById("isOwnProfile").value;
console.log(isOwnProfile);

//if the User is not on their own profile, The cursor becomes a pointer when the user hovers over the like button to indicate that it can be clicked 
//we also create a PUT request to add or remove a like on click 
if(isOwnProfile == "false"){
	likeButton.onmouseover = setHover();
	likeButton.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200){
				let commentSectionWrapper = document.getElementById("commentSectionWrapper");
				commentSectionWrapper.innerHTML = this.responseText;
				//window.location.reload();
			}
		}
		let url = window.location.href;

		xhttp.open("PUT", url);
		xhttp.setRequestHeader("Content-Type", "text/html");
		xhttp.send();
	});
}

function setHover(){
	likeButton.style.cursor = "pointer";
}


//If the user has entered any comments on this artwork, there will be a delete button on the comment
//For any delete buttons that exist add an event listener to send a DELETE request to delete the comment 
let deleteButtons = Array.from(document.getElementsByClassName("deleteComment"));

deleteButtons.forEach(button => {
	button.addEventListener('click', function() {
		xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200){
				let commentSectionWrapper = document.getElementById("commentSectionWrapper");
				commentSectionWrapper.innerHTML = this.responseText;
			}
		}
		let urlSegments = (window.location.href).split('/');
		let artworkId = urlSegments[urlSegments.length -1];

		let data = {"artwork": artworkId, "comment": button.id};
		console.log(data);
		xhttp.open("DELETE", '/artworks/comment');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
	});
});
