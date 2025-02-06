const apiKey = 'c286488c6a1a48fbb7660127250602';
const apiUrl = 'https://api.weatherapi.com/v1/current.json?key=';
const forecastUrl = 'https://api.weatherapi.com/v1/forecast.json?key=';

const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const forecastResult = document.getElementById('forecastResult');

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
        weatherResult.innerHTML = `<p>Location access denied. Please enter a city manually.</p>`;
      }
    );
  } else {
    weatherResult.innerHTML = `<p>Geolocation is not supported by your browser.</p>`;
  }
});

async function fetchWeather(city) {
  try {
    const response = await fetch(`${forecastUrl}${apiKey}&q=${city}&days=3`);
    const data = await response.json();

    if (data.error) {
      weatherResult.innerHTML = `<p>City not found. Please try again.</p>`;
    } else {
      updateUI(data);
    }
  } catch (error) {
    weatherResult.innerHTML = `<p>An error occurred. Please try again later.</p>`;
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(`${forecastUrl}${apiKey}&q=${lat},${lon}&days=3`);
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    weatherResult.innerHTML = `<p>Could not retrieve location weather. Try again later.</p>`;
  }
}

function updateUI(data) {
  const { location, current, forecast } = data;
  weatherResult.innerHTML = `
    <h2>${location.name}, ${location.country}</h2>
    <p>Temperature: ${current.temp_c}°C</p>
    <p>Weather: ${current.condition.text}</p>
    <img src="${current.condition.icon}" alt="${current.condition.text}">
    <p>Humidity: ${current.humidity}%</p>
    <p>Wind Speed: ${current.wind_kph} kph</p>
  `;

  // Update background based on weather condition
  updateBackground(current.condition.text);

  // Display 3-day forecast
  forecastResult.innerHTML = "<h3>3-Day Forecast</h3>";
  forecast.forecastday.forEach((day) => {
    forecastResult.innerHTML += `
      <div class="forecast-card">
        <p><strong>${new Date(day.date).toLocaleDateString()}</strong></p>
        <img src="${day.day.condition.icon}" alt="${day.day.condition.text}">
        <p>${day.day.condition.text}</p>
        <p>Max: ${day.day.maxtemp_c}°C / Min: ${day.day.mintemp_c}°C</p>
      </div>
    `;
  });
}

function updateBackground(condition) {
  let bgColor;
  if (condition.includes("Rain")) {
    bgColor = "#4a90e2"; // Blue
  } else if (condition.includes("Cloud")) {
    bgColor = "#bdc3c7"; // Gray
  } else if (condition.includes("Sunny") || condition.includes("Clear")) {
    bgColor = "#f1c40f"; // Yellow
  } else {
    bgColor = "#66a6ff"; // Default gradient
  }
  document.body.style.background = bgColor;
}