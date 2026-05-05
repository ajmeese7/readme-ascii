document.addEventListener("DOMContentLoaded", function() {
    const generateButton = document.getElementById("generateButton");
    generateButton.disabled = true;
    const downloadButton = document.getElementById("downloadButton");
    downloadButton.disabled = true;

    const asciiText = document.getElementById("asciiText");
    asciiText.oninput = () => {
        generateButton.disabled = !asciiText.value;
    };

    const form = document.getElementById("userInput");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (generateButton.disabled) return;
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
    const spinner = document.getElementsByClassName("spinner-border")[0];
    const image = document.getElementById("result");
    const downloadButton = document.getElementById("downloadButton");

    spinner.style.display = "block";
    image.style.visibility = "hidden";
    downloadButton.disabled = true;

    const asciiText = document.getElementById("asciiText").value;
    const rawTextColor = document.getElementById("txt-color").value;
    const rawBackgroundColor = document.getElementById("bg-color").value;
    const shadow = document.getElementById("shadow").checked;

    const textColor = normalizeColor(rawTextColor, "#000000");
    const transparent = isTransparent(rawBackgroundColor);
    const backgroundColor = transparent ? "transparent" : normalizeColor(rawBackgroundColor, "#FFFFFF");

    const showError = () => {
        image.setAttribute("src", "error.png");
        image.style.visibility = "visible";
        spinner.style.display = "none";
    };

    figlet.text(asciiText, { font: "Alpha" }, (err, ascii) => {
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

        const download = document.getElementById("download");
        download.href = pngUrl;
        download.download = `${asciiText.split(" ").join("_")}.png`;

        downloadButton.disabled = false;
        image.setAttribute("src", pngUrl);
        image.style.visibility = "visible";
        spinner.style.display = "none";
    });
}
