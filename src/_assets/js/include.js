
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

async function addCollapsibleClickEventListener() {
	var coll = document.getElementsByClassName("collapsible")[0];
	coll.addEventListener("click", function () {
		let arrow = this.querySelector(".arrow");
		var content = document.getElementsByClassName("links")[0];
		if (content.style.maxHeight) {
			content.style.maxHeight = null;
			//this.innerHTML = "Linkovi ▼";
			arrow.textContent = "▼";
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
			//this.innerHTML = "Linkovi ▲";
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

document.addEventListener('DOMContentLoaded', includeHTML);
document.addEventListener('DOMContentLoaded', addCollapsibleClickEventListener);
