import * as data from "world-cities-json";

const cityList = data.cities;

// ---------------- LOCATION SYSTEM ----------------

function generateRandomCoords() {
  const lat = (Math.random() * 180 - 90).toFixed(4);
  const lon = (Math.random() * 360 - 180).toFixed(4);

  return {
    lat,
    lon,
    name: "??, ??",
    isChaos: true,
  };
}

function generateCityLocation() {
  const city = cityList[Math.floor(Math.random() * cityList.length)];

  return {
    lat: city.lat,
    lon: city.lng,
    name: `${city.city}, ${city.country}`,
    isChaos: false,
  };
}

function getRandomLocation() {
  // 10% chaos chance
  if (Math.random() < 0.1) {
    return generateRandomCoords();
  }

  return generateCityLocation();
}

// ---------------- SCORE FUNCTION ----------------

function calculateScore(weatherData, isChaos) {
  let score = 0;

  const condition = weatherData.weather[0].main;
  const temp = weatherData.main.temp;
  const wind = Math.round(weatherData.wind.speed * 3.6);
  const visibility = weatherData.visibility;

  const weatherScores = {
    Clear: 5,
    Clouds: 10,
    Mist: 20,
    Fog: 25,
    Drizzle: 15,
    Rain: 30,
    Thunderstorm: 60,
    Snow: 50,
    Smoke: 40,
    Dust: 50,
    Sand: 70,
    Ash: 120,
    Squall: 100,
    Tornado: 300,
  };

  score += Math.round(temp);
  score += weatherScores[condition] || 10;

  // Heat bonuses
  if (temp >= 50) score += 100;
  else if (temp >= 45) score += 50;
  else if (temp >= 40) score += 25;
  else if (temp >= 35) score += 10;
  else if (temp >= 30) score += 5;

  // Cold bonuses
  if (temp <= -30) score += 100;
  else if (temp <= -15) score += 50;
  else if (temp <= 0) score += 20;

  // Wind bonuses
  if (wind >= 100) score += 100;
  else if (wind >= 60) score += 40;
  else if (wind >= 30) score += 15;

  // Visibility bonuses
  if (visibility <= 500) score += 35;
  else if (visibility <= 2000) score += 15;
  else if (visibility <= 5000) score += 5;

  // Blizzard combo
  if (condition === "Snow" && temp <= -15 && wind >= 40) {
    score *= 2;
  }

  // Heatwave
  if (condition === "Clear" && temp >= 45) {
    score *= 1.8;
  }

  // Storm combo
  if (condition === "Thunderstorm" && wind >= 60) {
    score *= 2;
  }

  // tornado
  if (condition === "Tornado") {
    score *= 4;
  }

  // Chaos bonus
  if (isChaos) {
    score *= 1.3;
  }

  return Math.floor(score);
}

// ---------------- SINGLE WEATHER ROLL ----------------

async function rollWeather() {
  const location = getRandomLocation();

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${process.env.OWM_KEY}`;

  const res = await fetch(url);
  const weatherData = await res.json();

  const condition = weatherData.weather[0].main;
  const temp = weatherData.main.temp;
  const wind = Math.round(weatherData.wind.speed * 3.6);
  const visibility = weatherData.visibility;

  const score = calculateScore(weatherData, location.isChaos);

  return {
    city: location.name,
    // country: weatherData.sys?.country,
    lat: location.lat,
    lon: location.lon,
    condition,
    temp,
    wind,
    visibility,
    score,
    isChaos: location.isChaos,
  };
}

// ---------------- MAIN GAME FUNCTION ----------------

export async function generateWeatherRoll() {
  const rolls = await Promise.all([
    rollWeather(),
    rollWeather(),
    rollWeather(),
    rollWeather(),
    rollWeather(),
  ]);

  // Sort highest -> lowest
  rolls.sort((a, b) => b.score - a.score);

  // Top 2
  const finalists = rolls.slice(0, 2);

  // Random pick from top 2
  const chosen = finalists[Math.floor(Math.random() * finalists.length)];

  return {
    chosen,
    rolls,
  };
}
