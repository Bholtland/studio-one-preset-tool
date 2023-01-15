import decompress from "decompress";
import { createPreset } from "./build.js";
import { combineData, getProjectStructure } from "./parsing.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

function getConfig() {
	const pathInMatch = process.env.IN_PATH.match(/(.*)\/(.*\.song)/);

	if (!pathInMatch[1] && !pathInMatch[2]) {
		throw Error("No valid in path set");
	}

	if (!process.env.OUT_PATH) {
		throw Error("No valid out path set");
	}

	return {
		in: {
			path: pathInMatch[1],
			fileName: pathInMatch[2],
			full: process.env.IN_PATH,
		},
		out: {
			path: process.env.OUT_PATH,
		},
	};
}

async function extractProject(config) {
	await decompress(config.in.full, `${config.in.path}/songContents`);
}

function cleanup(config) {
	fs.rmSync(`${config.in.path}/temp`, { recursive: true });
	fs.rmSync(`${config.in.path}/songContents`, { recursive: true });
}

async function buildPresets(combinedData, jsonStructure, config) {
	// if (!fs.existsSync('./temp')) {}
	// fs.mkdirSync('')

	return await Promise.all(
		Object.values(combinedData).map((preset) =>
			createPreset(preset, jsonStructure, config)
		)
	);
}

async function main() {
	const config = getConfig();

	await extractProject(config);

	const jsonStructure = getProjectStructure(config);
	const combinedData = combineData(jsonStructure);

	await buildPresets(combinedData, jsonStructure, config);

	cleanup(config);

	console.log(`Exported ${Object.entries(combinedData).length} presets.`);
}

main();
