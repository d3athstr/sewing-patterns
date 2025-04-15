// JavaScript for the Sewing Patterns project

const baseUrl = "http://garmentgallery.empire12.net";  // Updated base URL

// Sample function to fetch data from the server
function fetchData(endpoint) {
  fetch(`${baseUrl}/${endpoint}`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

document.addEventListener("DOMContentLoaded", function(){
  // Notify that the public domain is in use.
  console.log("Sewing Patterns is running on:", baseUrl);
});
