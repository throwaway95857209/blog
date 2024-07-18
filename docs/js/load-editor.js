function loadScripts(array, callback) {
    var loader = function (src, handler) {
        var script = document.createElement("script");
        script.src = src;
        script.onload = script.onreadystatechange = function () {
            script.onreadystatechange = script.onload = null;
            handler();
        }
        var head = document.getElementsByTagName("head")[0];
        (head || document.body).appendChild(script);
    };
    (function run() {
        if (array.length != 0) {
            loader(array.shift(), run);
        } else {
            callback && callback();
        }
    })();
}

const loadStyleSheet = function (url) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    document.head.appendChild(link);
}

const createEditor = function (holder) {
    const editor = new EditorJS({
        holder: holder,
        autofocus: true,
        placeholder: 'Type text or paste a link',
        tools: {
            header: {
                class: Header,
                inlineToolbar: ['link', 'marker'],
                tunes: ['anyTuneName']
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
                tunes: ['anyTuneName']
            },
            image: {
                class: SimpleImage,
                inlineToolbar: true,
                config: {
                    placeholder: 'Paste image URL'
                },
                tunes: ['anyTuneName']
            },
            list: {
                class: NestedList,
                inlineToolbar: true
            },
            code: {
                class: CodeTool
            },
            quote: {
                class: Quote,
                inlineToolbar: true,
            },
            delimiter: Delimiter,
            embed: Embed,
            table: {
                class: Table,
                inlineToolbar: true
            },
            raw: RawTool,
            inlineCode: {
                class: InlineCode
            },
            marker: {
                class: Marker
            },
            warning: Warning,
            checklist: Checklist,
            anyTuneName: {
                class: AlignmentBlockTune,
                config: {
                    default: 'left',
                    blocks: {
                    }
                }
            }
        },
        defaultBlock: 'paragraph',

        onReady: () => {
            setTimeout(() => {
                new Undo({ editor });
                new DragDrop(editor);

                (async () => {
                    if (window.location.hash && window.location.hash !== "#new") {
                        const link = window.location.hash.substring(1);
                        const response = await fetch(`content/${link}.json`);
                        const text = await response.text();
                        const data = JSON.parse(text);

                        document.getElementById("title").innerText = data.title;
                        document.getElementById("subtitle").innerText = data.subtitle;
                        document.getElementById("author").innerText = data.author;
                        document.getElementById("created").innerText = getFormattedDate(+data.created);

                        await editor.render(data.content);

                        if (data.properties["background-image"]) {
                            document.querySelector("header.masthead").style.backgroundImage = `url(${data.properties["background-image"]})`;
                        } else {
                            document.querySelector("header.masthead").style.backgroundImage = "url(assets/img/default.jpg)";
                        }
                    }
                    editor.readOnly.toggle(true);
                    document.getElementById('editor').editor = editor;
                })();

            }, 200);
        }
    });
    return editor;
};

loadStyleSheet("plugins/simple-image/simple-image.css");
loadStyleSheet("css/load-editor.css");

loadScripts([
    "https://cdn.jsdelivr.net/npm/@editorjs/editorjs",
    "https://cdn.jsdelivr.net/npm/@editorjs/paragraph",
    "plugins/simple-image/simple-image.js",
    "https://cdn.jsdelivr.net/npm/@editorjs/checklist",
    "https://cdn.jsdelivr.net/npm/@editorjs/code",
    "https://cdn.jsdelivr.net/npm/@editorjs/delimiter",
    "https://cdn.jsdelivr.net/npm/@editorjs/embed",
    "https://cdn.jsdelivr.net/npm/@editorjs/header",
    "https://cdn.jsdelivr.net/npm/@editorjs/inline-code",
    "https://cdn.jsdelivr.net/npm/@editorjs/marker",
    "https://cdn.jsdelivr.net/npm/@editorjs/nested-list",
    "https://cdn.jsdelivr.net/npm/@editorjs/quote",
    "https://cdn.jsdelivr.net/npm/@editorjs/raw",
    "https://cdn.jsdelivr.net/npm/@editorjs/table",
    "https://cdn.jsdelivr.net/npm/@editorjs/warning",
    "https://cdn.jsdelivr.net/npm/editorjs-undo",
    "https://cdn.jsdelivr.net/npm/editorjs-drag-drop",
    "https://cdn.jsdelivr.net/npm/editorjs-text-alignment-blocktune"
], function (ev) {
    createEditor('editor');
});

const getFormattedDate = function (created) {
    const date = new Date(created);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options);
};

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years ago";
    }
    if (interval === 1) {
        return interval + " year ago";
    }

    const months = Math.floor(seconds / 2628000);
    if (months > 1) {
        return months + " months ago";
    }
    if (months === 1) {
        return months + " month ago";
    }

    const days = Math.floor(seconds / 86400);
    if (days > 1) {
        return days + " days ago";
    }
    if (days === 1) {
        return days + " day ago";
    }

    const hours = Math.floor(seconds / 3600);
    if (hours > 1) {
        return hours + " hours ago";
    }
    if (hours === 1) {
        return hours + " hour ago";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) {
        return minutes + " minutes ago";
    }
    if (minutes === 1) {
        return minutes + " minute ago";
    }

    return "just now";
}

document.addEventListener("paste", e => {
    if (!e.target.classList.contains("paste")) return;

    e.preventDefault();
    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
    insertTextAtSelection(e.target, text);
});

function insertTextAtSelection(target, txt) {
    let sel = window.getSelection();
    let text = target.textContent;
    let before = Math.min(sel.focusOffset, sel.anchorOffset);
    let after = Math.max(sel.focusOffset, sel.anchorOffset);
    let afterStr = text.substring(after);
    if (afterStr == "") afterStr = "\n";
    target.textContent = text.substring(0, before) + txt + afterStr;
    sel.removeAllRanges();
    let range = document.createRange();
    range.setStart(target.childNodes[0], before + txt.length);
    range.setEnd(target.childNodes[0], before + txt.length);
    sel.addRange(range);
}
