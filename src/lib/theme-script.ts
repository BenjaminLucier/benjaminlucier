import { THEME_COLORS } from "./theme-colors";

// Runs synchronously in <head>, before first paint, so the page never flashes
// the wrong palette. `pref` is "light" | "dark" | "system"; defaults to dark
// when nothing is stored or the OS preference can't be determined.
// Also keeps the theme-color meta (browser chrome) in sync with the mode.
export const themeScript = `(function(){try{
var d=document.documentElement,
t=document.querySelector('meta[name="theme-color"]'),
c=${JSON.stringify(THEME_COLORS)},
p=localStorage.getItem("theme-pref")||"dark",
m=typeof matchMedia=="function"?matchMedia("(prefers-color-scheme: dark)"):null;
function a(){var k=p==="system"?(m&&!m.matches?"light":"dark"):p;
d.dataset.mode=k;d.dataset.pref=p;
if(t)t.content=c[k]}
a();
if(m)m.addEventListener("change",function(){p=localStorage.getItem("theme-pref")||"dark";a()});
}catch(e){}})();`;
