function swap(shown, hidden) {
  document.getElementById(shown).style.display = "initial";
  document.getElementById(hidden).style.display = "none";
  return false;
}

function addEventListeners() {
  [].forEach.call(document.querySelectorAll(".range > .checkbox"), function(el) {
    el.addEventListener("click", () => {
      const markingDivs = document.querySelectorAll(`#${el.getAttribute("data")}`);
      [].forEach.call(markingDivs, markingDiv => {
        if (el.checked) {
          markingDiv.style.display = "block";
        } else {
          markingDiv.style.display = "none";
        }
      });
    });
  });
}

window.onload = addEventListeners;
