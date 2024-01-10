//grab the theme dropdown and add an event listener that sends a put request to change the theme

let themeSelect = document.getElementById("themeSelect");

themeSelect.addEventListener('change', function() {
	xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200){
				window.location.reload();
			}
		}
		let theme = themeSelect.value;

		let data = {"theme": theme};
		console.log(data);
		xhttp.open("PUT", '/theme');
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(data));
});