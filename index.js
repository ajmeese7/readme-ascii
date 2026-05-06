const DEBOUNCE_MS = 200;
const SPINNER_DELAY_MS = 300;

let debounceHandle = null;
let currentGenId = 0;

document.addEventListener("DOMContentLoaded", function() {
    const downloadButton = document.getElementById("downloadButton");
    downloadButton.disabled = true;

    const asciiText = document.getElementById("asciiText");

    const schedulePreview = () => {
        if (debounceHandle) clearTimeout(debounceHandle);
        if (!asciiText.value) {
            clearPreview();
            return;
        }
        debounceHandle = setTimeout(generateImage, DEBOUNCE_MS);
    };

    asciiText.addEventListener("input", schedulePreview);
    document.getElementById("font").addEventListener("change", schedulePreview);
    document.getElementById("shadow").addEventListener("change", schedulePreview);
    document.getElementById("txt-color").addEventListener("input", schedulePreview);
    document.getElementById("bg-color").addEventListener("input", schedulePreview);
    // Colorpicker plugin sets values programmatically, so listen for its event too.
    $("#text-color, #background-color").on("colorpickerChange", schedulePreview);

    const form = document.getElementById("userInput");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!asciiText.value) return;
        if (debounceHandle) clearTimeout(debounceHandle);
        generateImage();
    });

    const advanced = document.getElementById("advanced");
    const dropdown = document.getElementById("dropdown");
    dropdown.onclick = () => {
        if (advanced.offsetParent === null) {
            advanced.style.display = "block";
            dropdown.innerText = "▲";
        } else {
            advanced.style.display = "none";
            dropdown.innerText = "▼";
        }
    };
});

function clearPreview() {
    currentGenId++; // invalidate any in-flight generation
    const image = document.getElementById("result");
    const downloadButton = document.getElementById("downloadButton");
    const spinner = document.getElementsByClassName("spinner-border")[0];
    image.removeAttribute("src");
    image.style.visibility = "hidden";
    downloadButton.disabled = true;
    spinner.style.display = "none";
}

function isTransparent(color) {
    if (!color) return false;
    if (color === "transparent") return true;
    const match = color.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/i);
    return match ? parseFloat(match[1]) === 0 : false;
}

function normalizeColor(color, fallback) {
    if (!color) return fallback;
    if (color.startsWith("rgb") || color.startsWith("#")) return color;
    return "#" + color;
}

function asciiToPng(ascii, { textColor, backgroundColor, shadow, transparent }) {
    const fontSize = 12;
    const lineHeight = 12;
    const padding = 20;
    const font = `bold ${fontSize}px monospace`;

    const measure = document.createElement("canvas").getContext("2d");
    measure.font = font;
    const lines = ascii.split("\n");
    const maxWidth = lines.reduce((w, l) => Math.max(w, measure.measureText(l).width), 0);

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(maxWidth + padding * 2);
    canvas.height = lines.length * lineHeight + padding * 2;

    const ctx = canvas.getContext("2d");
    if (!transparent) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = font;
    ctx.textBaseline = "top";
    ctx.fillStyle = textColor;

    if (shadow) {
        // Mirrors the previous CSS `text-shadow: -1ex 0.2pc 6px <color>` at 12px monospace.
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = -16;
        ctx.shadowOffsetY = 3;
    }

    lines.forEach((line, i) => ctx.fillText(line, padding, padding + i * lineHeight));
    return canvas.toDataURL("image/png");
}

function generateImage() {
    const genId = ++currentGenId;
    const spinner = document.getElementsByClassName("spinner-border")[0];
    const image = document.getElementById("result");
    const downloadButton = document.getElementById("downloadButton");

    // Only show the spinner if generation is slow (e.g. first-time font fetch).
    // Fast regens skip the flicker entirely and just swap the image when ready.
    const spinnerDelay = setTimeout(() => {
        if (genId === currentGenId) {
            spinner.style.display = "block";
            image.style.visibility = "hidden";
        }
    }, SPINNER_DELAY_MS);

    const asciiText = document.getElementById("asciiText").value;
    const rawTextColor = document.getElementById("txt-color").value;
    const rawBackgroundColor = document.getElementById("bg-color").value;
    const shadow = document.getElementById("shadow").checked;
    const font = document.getElementById("font").value || "Alpha";

    const textColor = normalizeColor(rawTextColor, "#000000");
    const transparent = isTransparent(rawBackgroundColor);
    const backgroundColor = transparent ? "transparent" : normalizeColor(rawBackgroundColor, "#FFFFFF");

    const finish = () => {
        clearTimeout(spinnerDelay);
        spinner.style.display = "none";
    };

    const showError = () => {
        if (genId !== currentGenId) return;
        finish();
        image.setAttribute("src", "error.png");
        image.style.visibility = "visible";
        downloadButton.disabled = true;
    };

    figlet.text(asciiText, { font }, (err, ascii) => {
        if (genId !== currentGenId) return;

        if (err || !ascii) {
            showError();
            return;
        }

        let pngUrl;
        try {
            pngUrl = asciiToPng(ascii, { textColor, backgroundColor, shadow, transparent });
        } catch (e) {
            showError();
            return;
        }

        if (genId !== currentGenId) return;
        finish();

        const download = document.getElementById("download");
        download.href = pngUrl;
        download.download = `${asciiText.split(" ").join("_")}.png`;

        downloadButton.disabled = false;
        image.setAttribute("src", pngUrl);
        image.style.visibility = "visible";
    });
}
