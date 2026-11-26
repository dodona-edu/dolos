// A template that shares no fingerprints with sample1/2/3: different domain,
// different control flow, different call shapes. Used to prove that an
// unrelated template leaves the similarity of a pair exactly unchanged.
async function fetchWeather(city, units) {
  const response = await fetch(`https://api.example.org/v2/weather?q=${city}&u=${units}`);
  if (!response.ok) {
    throw new RangeError(`weather lookup failed with status ${response.status}`);
  }
  const { current, forecast } = await response.json();
  return {
    temperature: Math.round(current.temp * 10) / 10,
    wind: current.wind?.speed ?? null,
    days: forecast.map(({ date, high, low }) => ({ date, high, low })),
  };
}

export default fetchWeather;
