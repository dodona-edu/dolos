function swap(shown, hidden) {
  document.getElementById(shown).style.display = "initial";
  document.getElementById(hidden).style.display = "none";
  return false;
}

function onStart() {
  [].forEach.call(document.querySelectorAll(".range > .checkbox"), function(el) {
    el.checked = true;
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

  [].forEach.call(document.querySelectorAll(".toggleAll"), (el) => {
    el.checked = true;
    el.addEventListener("click", (event) => {
      const parentId = el.getAttribute("data-parent");
      const targetId = el.getAttribute("data-target");
      const checkboxes = document.querySelectorAll(`#${parentId} #${targetId} .checkbox`);
      [].forEach.call(checkboxes, (checkbox) => {
        if(checkbox.checked !== event.target.checked) {
          checkbox.click();
        }
      })
    })
  });
}

window.onload = onStart;
