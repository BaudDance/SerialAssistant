const cacheName = "v1"

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(cacheName);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(cacheName);
  const protocol = new URL(request.url).protocol
  // only cache http and https requests
  if (protocol == 'http:' || protocol == 'https:') {
    console.log('caching: ' + request.url)
    await cache.put(request, response);
  }
};

// Strategy: Stale-while-revalidate
const staleWhileRevalidate = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  return caches.match(request).then((cachedResponse) => {
    const fetchedResponse = new Promise(async (resolve, reject) => {

      // Next try to use (and cache) the preloaded response, if it's there
      const preloadResponse = await preloadResponsePromise;
      if (preloadResponse) {
        console.info("using preload response", preloadResponse);
        putInCache(request, preloadResponse.clone());
        resolve(preloadResponse);
      }

      // Next try to get the resource from the network
      try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        putInCache(request, responseFromNetwork.clone());
        resolve(responseFromNetwork);
      } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl);
        if (fallbackResponse) {
          return fallbackResponse;
        }
        // when even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object
        resolve(new Response("Network error happened", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        }))
      }

    }).then((networkResponse) => { return networkResponse });

    return cachedResponse || fetchedResponse;
  });
};

// Strategy: Cache first, falling back to network (not using for now)
const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // Next try to use (and cache) the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info("using preload response", preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// Enable navigation preload
const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener("activate", (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      // fallback image/assets for service worker need to be cached explicitly
      // these assets will be used and only be used when offline
      "/network-error.svg", 
      // TODO: Path of compiled scripts are unknown, 
      // those files will be cached by the following loading(s)
      // after the service worker has been installed
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    staleWhileRevalidate({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: "/network-error.svg",
    }),
  );
});
