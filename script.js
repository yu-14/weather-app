const apiKey = 'c286488c6a1a48fbb7660127250602';
const apiUrl = 'https://api.weatherapi.com/v1/current.json?key=';
const forecastUrl = 'https://api.weatherapi.com/v1/forecast.json?key=';

const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const forecastResult = document.getElementById('forecastResult');
const loader = document.getElementById('loader');
const alertsDiv = document.getElementById('alerts');
const themeBtn = document.getElementById('themeBtn');
const historyList = document.getElementById('historyList');

let isCelsius = true;
let lastWeatherData = null;
let darkMode = false;

// Initialize search history from localStorage
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

// Theme toggle
themeBtn?.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    themeBtn.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('weatherAppTheme', darkMode ? 'dark' : 'light');
});

// Search history functions
function addToHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        if (searchHistory.length > 5) searchHistory.pop();
        localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
        updateSearchHistory();
    }
}

function updateSearchHistory() {
    if (historyList) {
        historyList.innerHTML = searchHistory
            .map(city => `<li onclick="fetchWeather('${city}')">${city}</li>`)
            .join('');
    }
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        fetchWeather(city);
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showAlert('Location access denied. Please enter a city manually.', 'error');
            }
        );
    } else {
        showAlert('Geolocation is not supported by your browser.', 'error');
    }
});

async function fetchWeather(city) {
    try {
        loader.classList.add('loading');
        weatherResult.innerHTML = '';
        forecastResult.innerHTML = '';
        
        const weatherPromise = fetch(`${forecastUrl}${apiKey}&q=${city}&days=7&aqi=yes`);
        const airQualityPromise = fetch(`${apiUrl}${apiKey}&q=${city}&aqi=yes`);
        
        const [weatherResponse, airQualityResponse] = await Promise.all([
            weatherPromise, 
            airQualityPromise
        ]);

        const weatherData = await weatherResponse.json();
        const airQualityData = await airQualityResponse.json();

        if (weatherData.error) {
            showAlert(weatherData.error.message, 'error');
        } else {
            addToHistory(city);
            updateUI(weatherData, airQualityData);
        }
    } catch (error) {
        showAlert('An error occurred. Please try again later.', 'error');
        console.error('Weather API Error:', error);
    } finally {
        loader.classList.remove('loading');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        loader.classList.add('loading');
        const response = await fetch(`${forecastUrl}${apiKey}&q=${lat},${lon}&days=7&aqi=yes`);
        const data = await response.json();
        updateUI(data);
    } catch (error) {
        showAlert('Could not retrieve location weather. Try again later.', 'error');
    } finally {
        loader.classList.remove('loading');
    }
}

function updateUI(data, airQualityData = null) {
    lastWeatherData = data;
    const { location, current, forecast } = data;

    // Main weather card
    weatherResult.innerHTML = `
        <h2>${location.name}, ${location.country}</h2>
        <p class="temp-large">${isCelsius ? current.temp_c + '°C' : current.temp_f + '°F'}</p>
        <div class="weather-icon">
            <img src="${current.condition.icon}" alt="${current.condition.text}">
            <p>${current.condition.text}</p>
        </div>
        
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <p>Humidity: ${current.humidity}%</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <p>Wind: ${current.wind_kph} kph</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-temperature-high"></i>
                <p>Feels Like: ${isCelsius ? current.feelslike_c + '°C' : current.feelslike_f + '°F'}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <p>UV Index: ${current.uv}</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <p>Precipitation: ${current.precip_mm} mm</p>
            </div>
            <div class="detail-item">
                <i class="fas fa-compress-alt"></i>
                <p>Pressure: ${current.pressure_mb} mb</p>
            </div>
        </div>
        
        <div class="sun-times">
            <div>
                <i class="fas fa-sunrise"></i>
                <p>Sunrise: ${forecast.forecastday[0].astro.sunrise}</p>
            </div>
            <div>
                <i class="fas fa-sunset"></i>
                <p>Sunset: ${forecast.forecastday[0].astro.sunset}</p>
            </div>
        </div>
        
        <div class="unit-toggle">
            <button id="tempToggle">Switch to ${isCelsius ? '°F' : '°C'}</button>
        </div>
    `;

    // Air Quality (if available)
    if (airQualityData && airQualityData.current.air_quality) {
        const aqi = airQualityData.current.air_quality["us-epa-index"];
        const aqiClass = getAQIClass(aqi);
        weatherResult.innerHTML += `
            <div class="air-quality ${aqiClass}">
                <h3>Air Quality</h3>
                <p>AQI: ${aqi} - ${getAQIDescription(aqi)}</p>
            </div>
        `;
    }

    // Weekly forecast
    forecastResult.innerHTML = "<h3>7-Day Forecast</h3>";
    forecast.forecastday.forEach((day) => {
        const maxTemp = isCelsius ? day.day.maxtemp_c + '°C' : day.day.maxtemp_f + '°F';
        const minTemp = isCelsius ? day.day.mintemp_c + '°C' : day.day.mintemp_f + '°F';
        
        forecastResult.innerHTML += `
            <div class="forecast-card">
                <p><strong>${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong></p>
                <img src="${day.day.condition.icon}" alt="${day.day.condition.text}">
                <p>${day.day.condition.text}</p>
                <p>Max: ${maxTemp}</p>
                <p>Min: ${minTemp}</p>
                <p><i class="fas fa-tint"></i> ${day.day.daily_chance_of_rain}%</p>
            </div>
        `;
    });

    updateBackground(current.condition.text);
    
    // Reattach temperature toggle event
    document.getElementById('tempToggle').addEventListener('click', () => {
        isCelsius = !isCelsius;
        updateUI(lastWeatherData, airQualityData);
    });
}

function showAlert(message, type) {
    if (alertsDiv) {
        alertsDiv.className = `alerts alert-${type}`;
        alertsDiv.textContent = message;
        alertsDiv.style.display = 'block';
        setTimeout(() => {
            alertsDiv.style.display = 'none';
        }, 5000);
    }
}

function getAQIClass(aqi) {
    if (aqi <= 2) return 'aqi-good';
    if (aqi <= 4) return 'aqi-moderate';
    return 'aqi-poor';
}

function getAQIDescription(aqi) {
    const descriptions = {
        1: 'Good',
        2: 'Moderate',
        3: 'Unhealthy for sensitive groups',
        4: 'Unhealthy',
        5: 'Very Unhealthy',
        6: 'Hazardous'
    };
    return descriptions[aqi] || 'Unknown';
}

function updateBackground(condition) {
    let bgColor;
    if (condition.includes("Rain")) {
        bgColor = "#4a90e2";
    } else if (condition.includes("Cloud")) {
        bgColor = "#bdc3c7";
    } else if (condition.includes("Sunny") || condition.includes("Clear")) {
        bgColor = "#f1c40f";
    } else {
        bgColor = "#66a6ff";
    }
    document.body.style.background = bgColor;
}

// Copyright and footer functions
function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    const footerContent = `
        <div class="footer-content">
            <p>&copy; ${currentYear} Uttej P. All rights reserved.</p>
            <div class="social-links">
                <a href="https://github.com/yu-14" target="_blank" title="GitHub">
                    <i class="fab fa-github"></i>
                </a>
                <a href="https://www.linkedin.com/in/uttej-p14/" target="_blank" title="LinkedIn">
                    <i class="fab fa-linkedin"></i>
                </a>
            </div>
        </div>
    `;

    let footer = document.querySelector('.footer');
    if (!footer) {
        footer = document.createElement('footer');
        footer.className = 'footer';
        document.querySelector('.container').appendChild(footer);
    }
    footer.innerHTML = footerContent;
}

// Enter key functionality
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value;
        if (city) {
            fetchWeather(city);
        }
    }
});

// Version information
const APP_VERSION = '1.0.0';
console.log(`Weather App v${APP_VERSION} by Uttej P`);

// Initialize function
function initialize() {
    updateSearchHistory();
    updateCopyrightYear();
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('weatherAppTheme');
    if (savedTheme) {
        darkMode = savedTheme === 'dark';
        document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        if (themeBtn) {
            themeBtn.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }
}

// Initialize the app
initialize();