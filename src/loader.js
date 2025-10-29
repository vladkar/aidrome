console.log("loader.js injected");
const s = document.createElement("script");
s.src = "custom/custom-init.js";
s.type = "module"; // Enable ES6 module support
document.head.appendChild(s);
