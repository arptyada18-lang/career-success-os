const fs=require("fs");
const path=require("path");
function read(p){return fs.readFileSync(path.join(process.cwd(),p),"utf8")}
function assert(cond,msg){if(!cond){throw new Error(msg)}}
const jsFiles=["app.js","v3.js","v4.js","v5.js","v6.js","v7.js","sw.js"];
for(const f of jsFiles){
  const src=read(f);
  new Function(src);
  console.log("syntax ok:",f);
}
JSON.parse(read("manifest.json"));
const html=read("index.html");
for(const f of ["app.js","v3.js","v4.js","v5.js","v6.js","v7.js"]){
  assert(html.includes('src="'+f+'"'),"index.html missing "+f);
}
assert(html.includes('rel="manifest"'),"manifest link missing");
assert(html.includes('class="skip-link"'),"skip link missing");
assert(html.includes('aria-live="polite"'),"aria live toast missing");
const sw=read("sw.js");
assert(sw.includes("career-success-os-v7"),"service worker cache version not V7");
assert(sw.includes("./v7.js"),"v7.js missing from offline cache");
const v7=read("v7.js");
[
  "openWidgetManager",
  "agendaHtml",
  "toggleAccessibility",
  "repairCareerOSData",
  "restoreLastGoodData",
  "openShortcutHelp"
].forEach(k=>assert(v7.includes(k),"V7 feature missing: "+k));
console.log("Career & Success OS smoke checks passed.");
