// public/sw.js

self.addEventListener('push', function (event) {
    // 1. Parse Payload
    // Since we are E2EE, the payload is minimal: "New encrypted message from <Sender>"
    // or completely generic: "New Message".
    // The Server sends a JSON payload.

    let data = { title: 'uunn', body: 'New encrypted message', url: '/' };

    if (event.data) {
        try {
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            console.error("Push data parse error", e);
            data.body = event.data.text();
        }
    }

    // 2. Show Notification
    const options = {
        body: data.body,
        icon: '/icon-192x192.png', // Ensure this exists or use default
        badge: '/badge-72x72.png', // Android specific
        vibrate: [100, 50, 100],
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Open the app/url
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window for this URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
