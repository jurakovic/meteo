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

document.addEventListener('DOMContentLoaded', includeHTML);
