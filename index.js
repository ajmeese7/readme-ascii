const DEBOUNCE_MS = 200;
const SPINNER_DELAY_MS = 300;
const CONTRAST_THRESHOLD = 4.5; // WCAG AA for normal text
const FORM_STATE_KEY = "form-state";

let debounceHandle = null;
let currentGenId = 0;

document.addEventListener("DOMContentLoaded", function() {
    initTheme();
    restoreFormState();

    const downloadButton = document.getElementById("downloadButton");
    downloadButton.disabled = true;

    const asciiText = document.getElementById("asciiText");
    const transparentBg = document.getElementById("transparent-bg");
    const bgColor = document.getElementById("bg-color");

    const schedulePreview = () => {
        saveFormState();
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
    document.getElementById("txt-color").addEventListener("input", () => {
        updateContrastGlow();
        schedulePreview();
    });
    bgColor.addEventListener("input", schedulePreview);
    transparentBg.addEventListener("change", () => {
        bgColor.disabled = transparentBg.checked;
        schedulePreview();
    });

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

    const themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        updateContrastGlow();
    });

    updateContrastGlow();

    // Render restored state immediately (skip debounce) so the preview is
    // there on first paint instead of waiting for the user to interact.
    if (asciiText.value) generateImage();
});

/* ---------- Form persistence ---------- */

function saveFormState() {
    const state = {
        text: document.getElementById("asciiText").value,
        font: document.getElementById("font").value,
        textColor: document.getElementById("txt-color").value,
        bgColor: document.getElementById("bg-color").value,
        transparent: document.getElementById("transparent-bg").checked,
        shadow: document.getElementById("shadow").checked,
    };
    try { localStorage.setItem(FORM_STATE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function restoreFormState() {
    let raw = null;
    try { raw = localStorage.getItem(FORM_STATE_KEY); } catch (e) { return; }
    if (!raw) return;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return; }
    if (!s || typeof s !== "object") return;

    const set = (id, key, prop) => {
        if (typeof s[key] === (prop === "checked" ? "boolean" : "string")) {
            document.getElementById(id)[prop] = s[key];
        }
    };
    set("asciiText", "text", "value");
    set("font", "font", "value");
    set("txt-color", "textColor", "value");
    set("bg-color", "bgColor", "value");
    set("transparent-bg", "transparent", "checked");
    set("shadow", "shadow", "checked");

    // Sync derived state
    document.getElementById("bg-color").disabled = document.getElementById("transparent-bg").checked;
}

/* ---------- Theme ---------- */

function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.getElementById("themeToggle");
    if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("theme", theme); } catch (e) { /* private mode */ }
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) { /* private mode */ }
    if (saved === "dark" || saved === "light") {
        applyTheme(saved);
        return;
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
}

/* ---------- Contrast ---------- */

function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
    ];
}

function rgbStringToArray(rgb) {
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m) return [255, 255, 255];
    return m.slice(0, 3).map(Number);
}

function relativeLuminance([r, g, b]) {
    const channel = c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(rgb1, rgb2) {
    const l1 = relativeLuminance(rgb1);
    const l2 = relativeLuminance(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function pageBgRgb() {
    // Read the CSS variable directly (not body's transitioning background-color)
    // so the glow check isn't fooled by the in-flight theme fade.
    const v = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    if (v.startsWith("#")) return hexToRgb(v);
    return rgbStringToArray(v);
}

function updateContrastGlow() {
    const txtColor = document.getElementById("txt-color");
    const toggle = document.getElementById("themeToggle");
    if (!txtColor || !toggle) return;

    const text = hexToRgb(txtColor.value);
    const pageBg = pageBgRgb();
    const ratio = contrastRatio(text, pageBg);

    if (ratio < CONTRAST_THRESHOLD) {
        toggle.classList.add("glow");
        toggle.title = `Low contrast (${ratio.toFixed(1)}:1) , flip the theme to see the preview better.`;
    } else {
        toggle.classList.remove("glow");
        toggle.title = "Toggle light/dark theme";
    }
}

/* ---------- Preview ---------- */

function clearPreview() {
    currentGenId++; // invalidate any in-flight generation
    const image = document.getElementById("result");
    const downloadButton = document.getElementById("downloadButton");
    const spinner = document.querySelector(".spinner-container");
    image.removeAttribute("src");
    image.style.visibility = "hidden";
    downloadButton.disabled = true;
    spinner.classList.remove("show");
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
        ctx.shadowColor = textColor;
        ctx.shadowBlur = fontSize * 0.85;
        ctx.shadowOffsetX = -fontSize * 0.45;
        ctx.shadowOffsetY = fontSize * 0.45;
    }

    lines.forEach((line, i) => ctx.fillText(line, padding, padding + i * lineHeight));
    return canvas.toDataURL("image/png");
}

function generateImage() {
    const genId = ++currentGenId;
    const spinner = document.querySelector(".spinner-container");
    const image = document.getElementById("result");
    const downloadButton = document.getElementById("downloadButton");

    // Only show the spinner if generation is slow (e.g. first-time font fetch).
    // Fast regens skip the flicker entirely and just swap the image when ready.
    const spinnerDelay = setTimeout(() => {
        if (genId === currentGenId) {
            spinner.classList.add("show");
            image.style.visibility = "hidden";
        }
    }, SPINNER_DELAY_MS);

    const asciiText = document.getElementById("asciiText").value;
    const textColor = document.getElementById("txt-color").value;
    const transparent = document.getElementById("transparent-bg").checked;
    const backgroundColor = transparent ? "transparent" : document.getElementById("bg-color").value;
    const shadow = document.getElementById("shadow").checked;
    const font = document.getElementById("font").value || "Alpha";

    const finish = () => {
        clearTimeout(spinnerDelay);
        spinner.classList.remove("show");
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
