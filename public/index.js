// TODO: More clear file names

// Waits until the document's elements are available
document.addEventListener("DOMContentLoaded", function(event) {
    let generateButton = document.getElementById("generateButton");
    generateButton.disabled = false;

    // Disables button if asciiText empty; otherwise enabled
    let asciiText = document.getElementById("asciiText");
    asciiText.oninput = function() {
        if (!!asciiText.value) return generateButton.disabled = false;
        generateButton.disabled = true;
    };
});

function generateImage() {
    // Unhide loader and hides previous image
    let spinner = document.getElementsByClassName("spinner-border")[0];
    spinner.style.display = 'block';
    let image = document.getElementById("result");
    image.style.display = 'none';

    let asciiText = document.getElementById("asciiText").value;
    asciiText = encodeURIComponent(asciiText);

    let client = new HttpClient();
    client.get(`/generate?text=${asciiText}`, function(response) {
        image.setAttribute('src', response);
        image.style.display = 'block';

        // Hide loader
        spinner.style.display = 'none';
    });
}

// https://stackoverflow.com/a/22076667/6456163
var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
}