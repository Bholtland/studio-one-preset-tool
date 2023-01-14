import decompress from "decompress";
import { createPreset } from "./build.js";
import { combineData, getProjectStructure } from "./parsing.js";
import fs from "fs";

async function extractProject() {
	await decompress("./song.song", "./songContents");
}

function cleanup() {
	fs.rmSync("./temp", { recursive: true });
	fs.rmSync("./songContents", { recursive: true });
}

async function buildPresets(combinedData, jsonStructure) {
	// if (!fs.existsSync('./temp')) {}
	// fs.mkdirSync('')

	return await Promise.all(
		Object.values(combinedData).map((preset) =>
			createPreset(preset, jsonStructure)
		)
	);
}

async function main() {
	await extractProject();

	const jsonStructure = getProjectStructure();
	const combinedData = combineData(jsonStructure);

	await buildPresets(combinedData, jsonStructure);

	cleanup();

	console.log(Object.entries(combinedData).length);
}

main();
