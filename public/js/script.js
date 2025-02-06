const socket = io();

if(navigator.geolocation){
    navigator.geolocation.watchPosition((position) => {
        const {latitude, longitude} = position.coords;
        socket.emit("send-location", {latitude, longitude});
    },
    (error)=>{
        console.error(error);
    },
    {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    }
);
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" , {
    attribution: "Shubham"
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
    const {id, latitude, longitude} = data;
    map.setView([latitude, longitude]);
    if(markers[id]){
        markers[id].setLatLng([latitude, longitude]);
    }
    else{
        markers[id] = L.marker([latitude, longitude]).addTo(map); 
    }
});

socket.on("user-disconnected", (id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

document.getElementById("sosButton").addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("sos-request", { latitude, longitude });
            alert("SOS request sent!");
        });
    }
});

socket.on("new-sos", (data) => {
    const sosList = document.getElementById("sosList");
    const listItem = document.createElement("li");
    listItem.innerHTML = `User ID: ${data.id} - Location: (${data.latitude}, ${data.longitude}) 
        <button onclick="acceptSOS('${data.id}', ${data.latitude}, ${data.longitude})">Accept</button>`;
    sosList.appendChild(listItem);
});

function acceptSOS(id, latitude, longitude) {
    socket.emit("sos-accepted", { id, latitude, longitude });
    alert("You accepted the SOS request!");
}

socket.on("sos-confirmation", (data) => {
    alert(data.message);
});

console.log("✅ script.js is loaded and running!");


document.addEventListener("DOMContentLoaded", () => {
    const sosButton = document.getElementById("sosButton");
    const statusMessage = document.getElementById("statusMessage");

    sosButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Send SOS request to the server
                    fetch("/sos", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ latitude, longitude }),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            statusMessage.textContent = "🚨 SOS sent successfully!";
                        })
                        .catch((error) => {
                            console.error("❌ Error sending SOS:", error);
                            statusMessage.textContent = "❌ Failed to send SOS!";
                        });
                },
                (error) => {
                    console.error("❌ Error getting location:", error);
                    statusMessage.textContent = "❌ Location access denied!";
                }
            );
        } else {
            statusMessage.textContent = "❌ Geolocation not supported!";
        }
    });
});



