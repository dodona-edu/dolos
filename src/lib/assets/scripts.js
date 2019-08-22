
function show(shown, hidden) {
    console.log(shown, hidden);
    document.getElementById(shown).style.display='block';
    document.getElementById(hidden).style.display='none';
    return false;
}