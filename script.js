

let scenario = "low";
let liveTemp = 25;

const cityData = {
    Delhi: { coords: [28.61, 77.20] },
    Mumbai: { coords: [19.07, 72.87] }
};

// Map Setup
const map = L.map('map', { zoomControl: false }).setView(cityData.Delhi.coords, 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = L.circle(cityData.Delhi.coords, { radius: 5000, color: '#38bdf8', weight: 1 }).addTo(map);

async function update(city) {
    document.getElementById('ticker').innerText = `CALIBRATING SATELLITE FOR ${city.toUpperCase()}...`;
    try {
        const [wRes, aRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${W_KEY}`),
            fetch(`https://api.waqi.info/feed/${city}/?token=${A_TOKEN}`)
        ]);
        
        const wData = await wRes.json();
        const aData = await aRes.json();

        liveTemp = wData.main.temp;
        document.getElementById('l-temp').innerText = Math.round(liveTemp) + "°C";
        document.getElementById('l-aqi').innerText = aData.data.aqi || "60";
        document.getElementById('l-hum').innerText = wData.main.humidity + "%";
        document.getElementById('l-wind').innerText = wData.wind.speed + "m/s";

        calculate(city, aData.data.aqi || 60);
    } catch(e) { 
        document.getElementById('ticker').innerText = "LINK ERROR: RETRYING..."; 
        calculate(city, 60); // Still update images even if API fails
    }
}

function calculate(city, aqi) {
    const year = document.getElementById('yearSelect').value;
    const isHigh = scenario === "high";
    const factor = year === "2100" ? 2.5 : 1.1;
    const mult = isHigh ? 2.2 : 0.4;
    const base = cityData[city];

    // Data Calculation
    document.getElementById('f-temp').innerText = (liveTemp + (factor * mult * 1.8)).toFixed(1) + "°C";
    document.getElementById('f-aqi').innerText = Math.round(aqi * (isHigh ? 1.9 : 0.6));
    document.getElementById('f-sea').innerText = city === "Mumbai" ? `+${(factor * mult * 0.4).toFixed(1)}m` : "STABLE";
    document.getElementById('f-food').innerText = isHigh ? "CRITICAL" : "SECURE";
    
    const safe = document.getElementById('f-safe');
    const alert = document.getElementById('risk-alert');

    if (isHigh) {
        safe.innerText = "UNSAFE"; safe.style.color = "#ef4444";
        alert.innerText = "RISK LEVEL: EXTREME"; alert.style.borderColor = "#ef4444"; alert.style.color = "#ef4444";
    } else {
        safe.innerText = "STABLE"; safe.style.color = "#22c55e";
        alert.innerText = "RISK LEVEL: MINIMAL"; alert.style.borderColor = "#38bdf8"; alert.style.color = "#38bdf8";
    }

    // LOCAL IMAGE LOGIC
    // Image naming: 2025.jpg (now), 2050Mumbai.jpg, 2050Delhi.jpg, 2100Mumbai.jpg, 2100Delhi.jpg
    document.getElementById('nowImg').src = `2025${city}.jpg`;
    document.getElementById('futureImg').src = `${year}${city}.jpg`;

    // Map Updates
    map.panTo(base.coords, { animate: true });
    marker.setLatLng(base.coords);
    marker.setStyle({ color: isHigh ? '#ef4444' : '#22c55e' });
    
    setTimeout(() => { map.invalidateSize(); }, 300);
    document.getElementById('ticker').innerText = "AI PROJECTION COMPLETE // LINK STABLE";
}

// Scenario Toggles
document.querySelectorAll('.scenario-toggle button').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.scenario-toggle .active').classList.remove('active');
        btn.classList.add('active');
        scenario = btn.dataset.scenario;
        update(document.getElementById('citySelect').value);
    }
});

// Select Listeners
document.getElementById('citySelect').onchange = (e) => update(e.target.value);
document.getElementById('yearSelect').onchange = () => update(document.getElementById('citySelect').value);

// Run Initial
window.onload = () => update("Delhi");

