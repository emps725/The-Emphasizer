import "dotenv/config";
import { generateWeatherRoll } from "./commands/weatherGame.js";

const result = await generateWeatherRoll();

console.log(result.chosen);
console.log(result.rolls);
