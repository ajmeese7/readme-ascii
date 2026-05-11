const DEBOUNCE_MS = 200;
const SPINNER_DELAY_MS = 300;
const CONTRAST_THRESHOLD = 4.5; // WCAG AA for normal text
const FORM_STATE_KEY = "form-state";
const SIDEBAR_KEY = "sidebar-collapsed";
const GRID_CONCURRENCY = 4;

const SHADOW_DEFAULTS = {
    "shadow-color": "#000000",
    "shadow-blur": "10",
    "shadow-offset-x": "-5",
    "shadow-offset-y": "5",
};

let debounceHandle = null;
let featuredGenId = 0;
let gridGenId = 0;
let comboboxItems = [];
let activeComboboxIdx = -1;

document.addEventListener("DOMContentLoaded", function() {
    initTheme();
    restoreFormState();
    initSidebar();
    initCombobox();

    const asciiText = document.getElementById("asciiText");
    const transparentBg = document.getElementById("transparent-bg");
    const bgColor = document.getElementById("bg-color");
    const shadow = document.getElementById("shadow");
    const shadowOptions = document.getElementById("shadowOptions");

    const scheduleAll = () => {
        saveFormState();
        if (debounceHandle) clearTimeout(debounceHandle);
        if (!asciiText.value) {
            featuredGenId++;
            gridGenId++;
            clearFeatured();
            clearGrid();
            return;
        }
        debounceHandle = setTimeout(() => {
            renderFeatured();
            renderGrid();
        }, DEBOUNCE_MS);
    };

    const scheduleFeatured = () => {
        saveFormState();
        if (debounceHandle) clearTimeout(debounceHandle);
        if (!asciiText.value) {
            featuredGenId++;
            clearFeatured();
            return;
        }
        debounceHandle = setTimeout(renderFeatured, DEBOUNCE_MS);
    };

    asciiText.addEventListener("input", scheduleAll);

    document.getElementById("font").addEventListener("change", () => {
        updateActiveCard();
        updateFeaturedLabel();
        scheduleFeatured();
    });

    shadow.addEventListener("change", () => {
        shadowOptions.hidden = !shadow.checked;
        scheduleAll();
    });

    document.querySelectorAll("#shadowOptions input").forEach((el) => {
        el.addEventListener("input", () => {
            updateShadowValueLabels();
            scheduleAll();
        });
    });

    document.getElementById("shadowReset").addEventListener("click", () => {
        for (const [id, value] of Object.entries(SHADOW_DEFAULTS)) {
            document.getElementById(id).value = value;
        }
        updateShadowValueLabels();
        scheduleAll();
    });

    document.getElementById("txt-color").addEventListener("input", () => {
        updateContrastGlow();
        scheduleAll();
    });
    bgColor.addEventListener("input", scheduleAll);
    transparentBg.addEventListener("change", () => {
        bgColor.disabled = transparentBg.checked;
        scheduleAll();
    });

    const form = document.getElementById("userInput");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!asciiText.value) return;
        if (debounceHandle) clearTimeout(debounceHandle);
        renderFeatured();
        renderGrid();
    });

    document.getElementById("prevFontBtn").addEventListener("click", () => navigateFont(-1));
    document.getElementById("nextFontBtn").addEventListener("click", () => navigateFont(1));

    document.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        navigateFont(e.key === "ArrowRight" ? 1 : -1);
    });

    const themeToggle = document.getElementById("themeToggle");
    themeToggle.addEventListener("click", () => {
        const next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        updateContrastGlow();
    });

    // Sync derived state to restored values.
    bgColor.disabled = transparentBg.checked;
    shadowOptions.hidden = !shadow.checked;
    updateShadowValueLabels();
    updateFeaturedLabel();
    updateContrastGlow();

    if (asciiText.value) {
        renderFeatured();
        renderGrid();
    }
});

function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag === "INPUT") {
        // Range/checkbox/color don't need arrows for editing; let them navigate.
        const type = (target.type || "").toLowerCase();
        return type === "text" || type === "search" || type === "email" || type === "url" || type === "number" || type === "tel" || type === "password";
    }
    return target.isContentEditable;
}

/* ---------- Form persistence ---------- */

function saveFormState() {
    const state = {
        text: document.getElementById("asciiText").value,
        font: document.getElementById("font").value,
        textColor: document.getElementById("txt-color").value,
        bgColor: document.getElementById("bg-color").value,
        transparent: document.getElementById("transparent-bg").checked,
        shadow: document.getElementById("shadow").checked,
        shadowColor: document.getElementById("shadow-color").value,
        shadowBlur: document.getElementById("shadow-blur").value,
        shadowOffsetX: document.getElementById("shadow-offset-x").value,
        shadowOffsetY: document.getElementById("shadow-offset-y").value,
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
        const expected = prop === "checked" ? "boolean" : "string";
        if (typeof s[key] === expected) {
            document.getElementById(id)[prop] = s[key];
        }
    };
    set("asciiText", "text", "value");
    set("font", "font", "value");
    set("txt-color", "textColor", "value");
    set("bg-color", "bgColor", "value");
    set("transparent-bg", "transparent", "checked");
    set("shadow", "shadow", "checked");
    set("shadow-color", "shadowColor", "value");
    set("shadow-blur", "shadowBlur", "value");
    set("shadow-offset-x", "shadowOffsetX", "value");
    set("shadow-offset-y", "shadowOffsetY", "value");
}

/* ---------- Theme ---------- */

function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.getElementById("themeToggle");
    if (toggle) toggle.textContent = theme === "dark" ? "\u{2600}\u{FE0F}" : "\u{1F319}";
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

/* ---------- Sidebar ---------- */

function initSidebar() {
    const app = document.getElementById("app");
    const toggle = document.getElementById("sidebarToggle");
    let collapsed = false;
    try { collapsed = localStorage.getItem(SIDEBAR_KEY) === "1"; } catch (e) {}
    applySidebar(collapsed);
    toggle.addEventListener("click", () => applySidebar(!app.classList.contains("sidebar-collapsed")));
}

function applySidebar(collapsed) {
    const app = document.getElementById("app");
    const toggle = document.getElementById("sidebarToggle");
    app.classList.toggle("sidebar-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); } catch (e) {}
}

/* ---------- Shadow value labels ---------- */

function updateShadowValueLabels() {
    const map = [
        ["shadow-blur", "shadow-blur-value"],
        ["shadow-offset-x", "shadow-offset-x-value"],
        ["shadow-offset-y", "shadow-offset-y-value"],
    ];
    map.forEach(([inputId, valueId]) => {
        const input = document.getElementById(inputId);
        const out = document.getElementById(valueId);
        if (input && out) out.textContent = input.value;
    });
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

/* ---------- Style options ---------- */

function styleOptions() {
    const textColor = document.getElementById("txt-color").value;
    const transparent = document.getElementById("transparent-bg").checked;
    const backgroundColor = transparent ? "transparent" : document.getElementById("bg-color").value;
    const shadow = document.getElementById("shadow").checked;
    const shadowColor = document.getElementById("shadow-color").value;
    const shadowBlur = parseFloat(document.getElementById("shadow-blur").value) || 0;
    const shadowOffsetX = parseFloat(document.getElementById("shadow-offset-x").value) || 0;
    const shadowOffsetY = parseFloat(document.getElementById("shadow-offset-y").value) || 0;
    return { textColor, backgroundColor, shadow, transparent, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY };
}

function asciiToPng(ascii, opts) {
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
    if (!opts.transparent) {
        ctx.fillStyle = opts.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = font;
    ctx.textBaseline = "top";
    ctx.fillStyle = opts.textColor;

    if (opts.shadow) {
        ctx.shadowColor = opts.shadowColor;
        ctx.shadowBlur = opts.shadowBlur;
        ctx.shadowOffsetX = opts.shadowOffsetX;
        ctx.shadowOffsetY = opts.shadowOffsetY;
    }

    lines.forEach((line, i) => ctx.fillText(line, padding, padding + i * lineHeight));
    return canvas.toDataURL("image/png");
}

function figletAsync(text, font) {
    return new Promise((resolve, reject) => {
        figlet.text(text, { font }, (err, ascii) => {
            if (err || !ascii) reject(err || new Error("empty figlet output"));
            else resolve(ascii);
        });
    });
}

/* ---------- Featured preview ---------- */

function clearFeatured() {
    const image = document.getElementById("result");
    const featured = document.getElementById("featuredPreview");
    image.removeAttribute("src");
    image.style.visibility = "hidden";
    featured.hidden = true;
    document.querySelector(".spinner-container").classList.remove("show");
    document.getElementById("downloadButton").disabled = true;
    document.getElementById("canvasDownloadButton").disabled = true;
}

function renderFeatured() {
    const genId = ++featuredGenId;
    const spinner = document.querySelector(".spinner-container");
    const image = document.getElementById("result");
    const featured = document.getElementById("featuredPreview");
    const downloadButton = document.getElementById("downloadButton");
    const canvasDownloadButton = document.getElementById("canvasDownloadButton");

    featured.hidden = false;
    updateFeaturedLabel();

    const spinnerDelay = setTimeout(() => {
        if (genId === featuredGenId) {
            spinner.classList.add("show");
            image.style.visibility = "hidden";
        }
    }, SPINNER_DELAY_MS);

    const text = document.getElementById("asciiText").value;
    const font = document.getElementById("font").value || "Alpha";
    const styles = styleOptions();

    const finish = () => {
        clearTimeout(spinnerDelay);
        spinner.classList.remove("show");
    };

    const showError = () => {
        if (genId !== featuredGenId) return;
        finish();
        image.setAttribute("src", "error.png");
        image.style.visibility = "visible";
        downloadButton.disabled = true;
        canvasDownloadButton.disabled = true;
    };

    figletAsync(text, font).then((ascii) => {
        if (genId !== featuredGenId) return;
        let pngUrl;
        try {
            pngUrl = asciiToPng(ascii, styles);
        } catch (e) {
            showError();
            return;
        }
        if (genId !== featuredGenId) return;
        finish();

        const baseName = text.split(" ").join("_");
        const fileName = `${baseName}.png`;
        const download = document.getElementById("download");
        download.href = pngUrl;
        download.download = fileName;
        const canvasDownload = document.getElementById("canvasDownload");
        canvasDownload.href = pngUrl;
        canvasDownload.download = fileName;

        downloadButton.disabled = false;
        canvasDownloadButton.disabled = false;
        image.setAttribute("src", pngUrl);
        image.style.visibility = "visible";
    }).catch(showError);
}

function updateFeaturedLabel() {
    const label = document.querySelector(".featured-label");
    if (label) label.textContent = document.getElementById("font").value || "";
}

/* ---------- Grid ---------- */

function getFontList() {
    return Array.from(document.getElementById("font").options).map(o => o.value);
}

function clearGrid() {
    const grid = document.getElementById("fontGrid");
    grid.innerHTML = "";
    grid.hidden = true;
}

async function renderGrid() {
    const genId = ++gridGenId;
    const grid = document.getElementById("fontGrid");
    const text = document.getElementById("asciiText").value;
    grid.innerHTML = "";
    if (!text) {
        grid.hidden = true;
        return;
    }
    grid.hidden = false;

    const fonts = getFontList();
    const activeFont = document.getElementById("font").value;
    const styles = styleOptions();

    const cards = fonts.map((font) => {
        const card = document.createElement("div");
        card.className = "font-card" + (font === activeFont ? " active" : "");
        card.dataset.font = font;
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Select font ${font}`);

        const label = document.createElement("div");
        label.className = "font-card-label";
        label.textContent = font;

        const preview = document.createElement("div");
        preview.className = "font-card-preview loading";

        card.appendChild(label);
        card.appendChild(preview);

        const pick = () => selectFont(font);
        card.addEventListener("click", pick);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick();
            }
        });

        grid.appendChild(card);
        return { font, preview };
    });

    let next = 0;
    const workers = Array.from({ length: GRID_CONCURRENCY }, async () => {
        while (next < cards.length) {
            const i = next++;
            const { font, preview } = cards[i];
            try {
                const ascii = await figletAsync(text, font);
                if (genId !== gridGenId) return;
                const pngUrl = asciiToPng(ascii, styles);
                if (genId !== gridGenId) return;
                preview.classList.remove("loading");
                const img = document.createElement("img");
                img.alt = font;
                img.src = pngUrl;
                preview.appendChild(img);
            } catch (e) {
                if (genId !== gridGenId) return;
                preview.classList.remove("loading");
                preview.classList.add("error");
                preview.textContent = "Render failed";
            }
        }
    });
    await Promise.all(workers);
}

function updateActiveCard() {
    const activeFont = document.getElementById("font").value;
    document.querySelectorAll(".font-card").forEach((c) => {
        c.classList.toggle("active", c.dataset.font === activeFont);
    });
}

function selectFont(font) {
    const select = document.getElementById("font");
    if (select.value === font) return;
    select.value = font;
    select.dispatchEvent(new Event("change"));
}

function navigateFont(direction) {
    const select = document.getElementById("font");
    const fonts = getFontList();
    if (!fonts.length) return;
    const idx = fonts.indexOf(select.value);
    const next = (idx + direction + fonts.length) % fonts.length;
    selectFont(fonts[next]);
    syncComboboxValue();
}

/* ---------- Combobox ---------- */

function initCombobox() {
    const input = document.getElementById("fontInput");
    const clear = document.getElementById("fontInputClear");
    const list = document.getElementById("fontList");
    const select = document.getElementById("font");
    const wrap = document.getElementById("fontCombobox");

    syncComboboxValue();
    refreshClearButton();

    const openList = (filter) => {
        renderComboboxOptions(filter);
        list.hidden = false;
        wrap.classList.add("open");
        input.setAttribute("aria-expanded", "true");
    };

    const closeList = () => {
        list.hidden = true;
        wrap.classList.remove("open");
        input.setAttribute("aria-expanded", "false");
        activeComboboxIdx = -1;
    };

    input.addEventListener("focus", () => {
        input.select();
        openList("");
    });
    input.addEventListener("input", () => {
        openList(input.value);
        refreshClearButton();
    });
    clear.addEventListener("click", () => {
        input.value = "";
        refreshClearButton();
        openList("");
        input.focus();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (list.hidden) openList(input.value);
            moveActive(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (list.hidden) openList(input.value);
            moveActive(-1);
        } else if (e.key === "Enter") {
            if (!list.hidden && comboboxItems.length) {
                e.preventDefault();
                const pick = comboboxItems[activeComboboxIdx >= 0 ? activeComboboxIdx : 0];
                if (pick) commitFont(pick);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeList();
            syncComboboxValue();
            input.blur();
        } else if (e.key === "Tab") {
            closeList();
        }
    });

    document.addEventListener("mousedown", (e) => {
        if (!wrap.contains(e.target)) {
            // Treat outside click as a cancel; restore the current selection in the input.
            closeList();
            syncComboboxValue();
        }
    });

    select.addEventListener("change", syncComboboxValue);
}

function refreshClearButton() {
    const input = document.getElementById("fontInput");
    const clear = document.getElementById("fontInputClear");
    clear.hidden = !input.value;
}

function syncComboboxValue() {
    const input = document.getElementById("fontInput");
    const select = document.getElementById("font");
    input.value = select.value;
    refreshClearButton();
}

function renderComboboxOptions(filter) {
    const list = document.getElementById("fontList");
    const select = document.getElementById("font");
    const allFonts = getFontList();
    const q = (filter || "").trim().toLowerCase();
    const matching = q ? allFonts.filter(f => f.toLowerCase().includes(q)) : allFonts;
    list.innerHTML = "";
    comboboxItems = matching;

    if (!matching.length) {
        const empty = document.createElement("div");
        empty.className = "combobox-empty";
        empty.textContent = "No fonts match";
        list.appendChild(empty);
        activeComboboxIdx = -1;
        return;
    }

    activeComboboxIdx = Math.max(0, matching.indexOf(select.value));

    matching.forEach((font, i) => {
        const item = document.createElement("div");
        item.className = "combobox-item";
        if (font === select.value) item.classList.add("selected");
        if (i === activeComboboxIdx) item.classList.add("active");
        item.dataset.font = font;
        item.setAttribute("role", "option");
        item.textContent = font;
        item.addEventListener("mousedown", (e) => {
            // mousedown so the input doesn't lose focus first and fire its outside-click handler.
            e.preventDefault();
            commitFont(font);
        });
        list.appendChild(item);
    });

    scrollActiveIntoView();
}

function moveActive(direction) {
    if (!comboboxItems.length) return;
    activeComboboxIdx = (activeComboboxIdx + direction + comboboxItems.length) % comboboxItems.length;
    const nodes = document.querySelectorAll("#fontList .combobox-item");
    nodes.forEach((n, i) => n.classList.toggle("active", i === activeComboboxIdx));
    scrollActiveIntoView();
}

function scrollActiveIntoView() {
    const list = document.getElementById("fontList");
    const node = list.querySelectorAll(".combobox-item")[activeComboboxIdx];
    if (node) node.scrollIntoView({ block: "nearest" });
}

function commitFont(font) {
    const select = document.getElementById("font");
    const input = document.getElementById("fontInput");
    const list = document.getElementById("fontList");
    const wrap = document.getElementById("fontCombobox");

    list.hidden = true;
    wrap.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    activeComboboxIdx = -1;

    if (select.value !== font) {
        select.value = font;
        select.dispatchEvent(new Event("change"));
    } else {
        // The dropdown was used to confirm the existing pick; just resync the textbox.
        syncComboboxValue();
    }
    input.blur();
}
