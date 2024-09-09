
function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

function scrollToElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.scrollIntoView({
			behavior: 'smooth'
		});
	}
}

let slideIndex = [1, 1, 1, 1];
let slideId = ["mySlides1", "mySlides2", "mySlides3", "mySlides4"]

function plusSlides(n, no) {
	showSlides(slideIndex[no] += n, no);
}

function showSlides(n, no) {
	let i;
	let x = document.getElementsByClassName(slideId[no]);
	if (n > x.length) { slideIndex[no] = 1 }
	if (n < 1) { slideIndex[no] = x.length }
	for (i = 0; i < x.length; i++) {
		x[i].style.display = "none";
	}
	x[slideIndex[no] - 1].style.display = "block";
}
