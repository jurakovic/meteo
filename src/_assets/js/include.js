function includeHTML() {
    const elements = document.querySelectorAll('[data-include-html]');
    elements.forEach(element => {
        const file = element.getAttribute('data-include-html');
        if (file) {
            fetch(file)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                })
                .then(data => {
                    element.innerHTML = data;
                    element.removeAttribute('data-include-html');
                    includeHTML(); // Recursive call to handle nested includes
                })
                .catch(error => console.error('Error fetching HTML fragment:', error));
        }
    });
}

function addCollapsibleClickEventListener() {
    var coll = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', includeHTML);
document.addEventListener('DOMContentLoaded', addCollapsibleClickEventListener);
