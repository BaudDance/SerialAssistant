const offlinePrefix = '[Offline] '

export function listenNetworkStatus() {
	addEventListener("offline", (event) => {
		console.log("Network: Offline")
		document.title = offlinePrefix + document.title
	});
	
	addEventListener("online", (event) => {
		console.log("Network: Online")
		document.title = document.title.replace(offlinePrefix, '')
	}); 

	// Initial title
	if (!navigator.onLine) {
		document.title = offlinePrefix + document.title
	}
}