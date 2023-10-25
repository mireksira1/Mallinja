const map = L.map('map');

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    minZoom: 11, // Prevent zooming out beyond a certain level
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

// Variable to keep track of the displayed routes
let routesElement = null;

// User's location
navigator.geolocation.getCurrentPosition((position) => {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    // Set the map view to the user's location
    map.setView([userLat, userLon], 15); // Adjust zoom level as needed

    // Fetch the bus stops data from the JSON file (bus_stops.json)
    fetch('bus_stops.json')
        .then((response) => response.json())
        .then((data) => {
            // Filter and display bus stops within a 200m radius of the user's location
            const nearbyBusStops = data.filter((busStop) => {
                const distance = calculateDistance(userLat, userLon, busStop.lat, busStop.lon);
                return distance <= 0.2; // 200m in kilometers
            });

            // Add markers for nearby bus stops
            nearbyBusStops.forEach((busStop) => {
                const marker = L.marker([busStop.lat, busStop.lon]).addTo(map);
                marker.bindPopup(`Name: ${busStop.name}<br>ID: ${busStop.id}`);

                // Add a click event to fetch and display bus routes
                marker.on('click', () => {
                    fetchBusRoutes(busStop.id);
                });
            });
        })
        .catch((error) => console.error('Error fetching data: ' + error));
});

// Helper function to calculate the distance between two coordinates (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Function to fetch and display bus routes
function fetchBusRoutes(busStopId) {
    const selectedBusStopRoutesUrl = "https://api2.meep.me/tripplan/api/v1/routers/malta_tallinja/index/stops/" + busStopId + "/routes";
    
    fetch(selectedBusStopRoutesUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        }
    })
        .then((response) => response.json())
        .then((routesData) => {
            // Removes duplicates by creating a Set
            const uniqueRoutes = new Set(routesData.map((route) => route.shortName));
            
            // Converts Set back to an array
            const uniqueRoutesArray = [...uniqueRoutes];
            
            // Element to display the bus routes
            const newRoutesElement = document.createElement('div');
            newRoutesElement.classList.add('bus-routes');
            newRoutesElement.innerHTML = "<b>Bus routes from this station</b><br>";
            uniqueRoutesArray.forEach((route) => {
                const color = `#${routesData.find((data) => data.shortName === route).color}`;
                newRoutesElement.innerHTML += `<span style="color: ${color};">${route} - ${routesData.find((data) => data.shortName === route).longName}</span><br>`;
            });
            
            // If a previous routes element exists, removes it
            if (routesElement && routesElement.parentElement) {
                routesElement.parentElement.removeChild(routesElement);
            }
            
            // Adds the new routes element below the map
            document.body.appendChild(newRoutesElement);
            
            // Updates global routes element reference
            routesElement = newRoutesElement;
        });
}
