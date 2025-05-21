
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

let previousWidth = 0;

function updateIframeSrc() {
	if (window.innerWidth !== previousWidth) {
		const windyFrame = document.getElementById('windyFrame');
		const blitzortungFrame = document.getElementById('blitzortungFrame');

		let wurl = windyFrame.src;
		let burl = blitzortungFrame.src;

		if (window.innerWidth < 800) {
			wurl = wurl.replace('&zoom=7', '&zoom=6')
			burl = burl.replace('#6/', '#5/')
		}
		else {
			wurl = wurl.replace('&zoom=6', '&zoom=7')
			burl = burl.replace('#5/', '#6/')
		}

		windyFrame.src = wurl;
		blitzortungFrame.src = burl;

		previousWidth = window.innerWidth;
	}
}

document.addEventListener('DOMContentLoaded', includeHTML);
document.addEventListener('DOMContentLoaded', addExpandableClickEventListener);

window.addEventListener('load', updateIframeSrc);
window.addEventListener('resize', () => {
	clearTimeout(window._resizeTimeout); // Optional: debounce to avoid excessive reloads
	window._resizeTimeout = setTimeout(updateIframeSrc, 200);
});
