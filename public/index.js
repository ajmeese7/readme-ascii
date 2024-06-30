// Waits until the document's elements are available
document.addEventListener("DOMContentLoaded", function (event) {
  const generateButton = document.getElementById("generateButton");
  generateButton.disabled = true;
  const downloadButton = document.getElementById("downloadButton");
  downloadButton.disabled = true;

  // Disables button if asciiText empty; otherwise enabled
  const asciiText = document.getElementById("asciiText");
  asciiText.oninput = () => {
    if (!!asciiText.value) return generateButton.disabled = false;
    generateButton.disabled = true;
  };

  // Configures advanced settings dropdown
  const advanced = document.getElementById("advanced");
  const dropdown = document.getElementById("dropdown");
  dropdown.onclick = () => {
    // https://stackoverflow.com/a/21696585/6456163
    if (advanced.offsetParent === null) {
      // TODO: Add a class that animates this transition
      advanced.style.display = "block";
      dropdown.innerText = "▲";
    } else {
      advanced.style.display = "none";
      dropdown.innerText = "▼";
    }
  }
});

function generateImage() {
  // Unhide loader, hide previous image, and disable download
  const spinner = document.getElementsByClassName("spinner-border")[0];
  spinner.style.display = "block";
  const image = document.getElementById("result");
  image.style.visibility = "hidden";
  const downloadButton = document.getElementById("downloadButton");
  downloadButton.disabled = true;

  const asciiText = document.getElementById("asciiText").value;
  const textColor = document.getElementById("txt-color").value;
  const backgroundColor = document.getElementById("bg-color").value;
  const shadow = document.getElementById("shadow").checked;
  const url = encodeURI(`/generate?text=${asciiText}&textColor=${textColor}&backgroundColor=${backgroundColor}&shadow=${shadow}`);

  const client = new HttpClient();
  client.get(url, function (response) {
    // Set download href to the image, and the name to the text,
    // but with spaces replaced with underscores
    const download = document.getElementById("download");
    download.href = response;
    download.download = `${asciiText.split(" ").join("_")}.png`;

    // Allow the download button
    downloadButton.disabled = false;

    // Set image src to retrieved image and display it
    image.setAttribute("src", response);
    image.style.visibility = "visible";

    // Hide loader
    spinner.style.display = "none";
  });
}

// https://stackoverflow.com/a/22076667/6456163
var HttpClient = function () {
  this.get = function (aUrl, aCallback) {
    const anHttpRequest = new XMLHttpRequest();
    anHttpRequest.onreadystatechange = function () {
      if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
        aCallback(anHttpRequest.responseText);
    }

    anHttpRequest.open("GET", aUrl, true);
    anHttpRequest.send(null);
  }
}
