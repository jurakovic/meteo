
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

async function addExpandableClickEventListener() {
    var expandable = document.getElementsByClassName("expandable")[0];
    expandable.addEventListener("click", function () {
        let arrow = this.querySelector(".arrow");
        var content = document.getElementsByClassName("links")[0];
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
            arrow.textContent = "▼";
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            arrow.textContent = "▲";
            setTimeout(() => {
                // reset smooth scrolling to make it work every time
                document.documentElement.style.scrollBehavior = "auto";
                document.body.style.scrollBehavior = "auto";

                // apply smooth scroll
                scrollToElement('links');

                // re-enable smooth scrolling after a short delay
                setTimeout(() => {
                    document.documentElement.style.scrollBehavior = "smooth";
                    document.body.style.scrollBehavior = "smooth";
                }, 50);
            }, 310);
        }
    });
}

function updateIframeSrc() {
    const windyFrame = document.getElementById('windyFrame');
    const blitzortungFrame = document.getElementById('blitzortungFrame');

    console.log(window.innerWidth);

    if (window.innerWidth < 800) {
        // set windy iframe
        let url = new URL(windyFrame.src);
        url.searchParams.set('zoom', 6);
        windyFrame.src = url.toString();

        // set blitzortung iframe
        url = blitzortungFrame.src;
        url = url.replace('#6/44.5/16.5', '#5/44.5/16.5')
        console.log(url);
        blitzortungFrame.src = url;
    }
}

document.addEventListener('DOMContentLoaded', includeHTML);
document.addEventListener('DOMContentLoaded', addExpandableClickEventListener);
window.addEventListener('load', updateIframeSrc);
