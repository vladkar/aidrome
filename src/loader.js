console.log("loader.js injected");
const s = document.createElement("script");
s.src = "custom/custom-init.js";
document.head.appendChild(s);
