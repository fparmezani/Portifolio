const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const header = document.querySelector(".header");
const nav = document.querySelector(".nav");
header?.addEventListener("click", (event) => {
  if (window.innerWidth > 1050) return;
  if (event.target.closest("a")) return;
  nav?.classList.toggle("active");
});
