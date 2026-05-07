
function setupFormConfirmations() {
	const forms = document.querySelectorAll("form[data-confirm]");

	forms.forEach((form) => {
		form.addEventListener("submit", (event) => {
			const message = form.getAttribute("data-confirm") ||
				"Are you sure you want to continue?";
			if (!globalThis.confirm(message)) {
				event.preventDefault();
			}
		});
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", setupFormConfirmations, {
		once: true,
	});
} else {
	setupFormConfirmations();
}
