
// Constants
const API_KEY = "be970e62d7ee406d854654896e8c4a5a";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

// DOM Elements
let searchBox, searchBtn, weatherIcon, loader, weatherCard, errorDisplay, weatherDisplay,
    cityDisplay, tempDisplay, descDisplay, humidityDisplay, windDisplay, hourlyForecastDiv;

// Helper Functions
const showLoader = () => loader.style.display = "block";
const hideLoader = () => loader.style.display = "none";
const showError = () => {
    errorDisplay.style.display = "block";
    weatherDisplay.style.display = "none";
};
const hideError = () => errorDisplay.style.display = "none";
const showWeather = () => weatherDisplay.style.display = "block";

// Weather Data Fetching
async function fetchWeatherData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

// Main Weather Check Function
async function checkWeather(city) {
    try {
        showLoader();
        hideError();
        const data = await fetchWeatherData(`${WEATHER_API_URL}${city}&appid=${API_KEY}`);
        updateWeatherData(data);
        await fetchHourlyForecast(city);
    } catch (error) {
        console.error("Error fetching the weather data: ", error);
        showError();
    } finally {
        hideLoader();
    }
}

// Update Weather UI
function updateWeatherData(data) {
    cityDisplay.textContent = data.name;
    tempDisplay.textContent = `${Math.round(data.main.temp)}°C`;
    descDisplay.textContent = data.weather[0].description;
    humidityDisplay.textContent = `${data.main.humidity}%`;
    windDisplay.textContent = `${data.wind.speed} km/h`;

    const mainWeather = data.weather[0].main;
    updateWeatherIcon(mainWeather, data.weather[0].icon);
    updateBackground(mainWeather);

    showWeather();
    localStorage.setItem('lastCity', data.name);
}

// Update Weather Icon
function updateWeatherIcon(mainWeather, iconCode) {
    const customIcons = ['Clouds', 'Clear', 'Rain', 'Mist', 'Drizzle', 'Snow'];
    weatherIcon.src = customIcons.includes(mainWeather)
        ? `images/${mainWeather.toLowerCase()}.png`
        : `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Update Background
function updateBackground(weather) {
    const gradients = {
        Clouds: "linear-gradient(135deg, #4e4e50, #9198e5)",
        Clear: "linear-gradient(135deg, #56ccf2, #2f80ed)",
        Rain: "linear-gradient(135deg, #3a3a3a, #4e54c8)",
        Mist: "linear-gradient(135deg, #757f9a, #d7dde8)",
        Drizzle: "linear-gradient(135deg, #4e4e50, #828bb2)",
        Snow: "linear-gradient(135deg, #e0eafc, #cfdef3)",
        default: "linear-gradient(135deg, #000000, #2200ff)"
    };
    weatherCard.style.background = gradients[weather] || gradients.default;
}

// Fetch and Display Hourly Forecast
async function fetchHourlyForecast(city) {
    try {
        if (!hourlyForecastDiv) {
            console.error("Hourly forecast div not found");
            return;
        }

        const data = await fetchWeatherData(`${FORECAST_API_URL}${city}&appid=${API_KEY}`);
        if (!data.list || !Array.isArray(data.list)) {
            throw new Error("Forecast data is missing or invalid");
        }

        hourlyForecastDiv.innerHTML = '';
        data.list.slice(0, 8).forEach(item => {
            const dateTime = new Date(item.dt * 1000);
            const hour = dateTime.getHours();
            const temp = Math.round(item.main.temp);
            const mainWeather = item.weather[0].main.toLowerCase();
            const iconCode = item.weather[0].icon;

            const forecastItem = document.createElement('div');
            forecastItem.className = 'hourly-item';

            const iconSrc = `images/${mainWeather}.png`;
            const fallbackIconSrc = `https://openweathermap.org/img/wn/${iconCode}.png`;

            const img = new Image();
            img.src = iconSrc;
            img.onerror = () => { img.src = fallbackIconSrc; };

            forecastItem.innerHTML = `
                <span>${hour}:00</span>
            `;
            forecastItem.appendChild(img);
            forecastItem.innerHTML += `
                <span>${temp}°C</span>
            `;

            hourlyForecastDiv.appendChild(forecastItem);
        });
    } catch (error) {
        console.error("Error fetching the forecast data: ", error);
    }
}

// Debounce Function
function debounce(func, delay) {
    let timer;
    return function() {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, arguments), delay);
    }
}

// Event Handlers
const handleSearch = () => {
    const city = searchBox.value.trim();
    if (city) checkWeather(city);
};

// Get Current Location Weather
async function getCurrentLocationWeather() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        const data = await fetchWeatherData(`${WEATHER_API_URL}&lat=${latitude}&lon=${longitude}&appid=${API_KEY}`);
        updateWeatherData(data);
        await fetchHourlyForecast(data.name);  // Use the city name for forecast
    } catch (error) {
        console.error("Error fetching current location weather data: ", error);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    searchBox = document.querySelector(".search input");
    searchBtn = document.querySelector(".search button");
    weatherIcon = document.querySelector(".weather-icon");
    loader = document.querySelector(".loader");
    weatherCard = document.querySelector(".card");
    errorDisplay = document.querySelector(".error");
    weatherDisplay = document.querySelector(".weather");
    cityDisplay = document.querySelector(".city");
    tempDisplay = document.querySelector(".temp");
    descDisplay = document.querySelector(".description");
    humidityDisplay = document.querySelector(".humidity");
    windDisplay = document.querySelector(".wind");
    hourlyForecastDiv = document.getElementById('hourly-forecast');

    // Add event listeners
    searchBtn.addEventListener("click", handleSearch);
    searchBox.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        } else {
            debounce(handleSearch, 300)();
        }
    });

    // Load initial weather data
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        searchBox.value = lastCity;
        checkWeather(lastCity);
    } else {
        getCurrentLocationWeather();
    }
});
