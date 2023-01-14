import decompress from "decompress";
import convert from "xml-js";
import fs from "fs";
import zipper from "zip-local";

function extractProject() {
	decompress("song.song", "songContents");
}

function getSongData() {
	const songXml = fs.readFileSync("songContents/Song/song.xml", "utf-8");
	const song = JSON.parse(convert.xml2json(songXml));

	const formattedSongData =
		song.elements[0].elements[0].elements[1].elements.reduce((acc, track) => {
			if (!acc[track.name]) {
				acc[track.name] = {};
			}

			const trackId =
				track.name === "MediaTrack"
					? track.elements[0].attributes.uid
					: track.attributes.trackID;

			acc[track.name][trackId] = track.attributes;

			return acc;
		}, {});

	return formattedSongData;
}

function getAudioSynthFolderData() {
	const audioSynthFolderDataXml = fs.readFileSync(
		"songContents/Devices/audiosynthfolder.xml",
		"utf-8"
	);
	const audioSynthFolderData = JSON.parse(
		convert.xml2json(audioSynthFolderDataXml)
	);

	const formattedAudioSynthFolderData =
		audioSynthFolderData.elements[0].elements.reduce((acc, track) => {
			if (!track.elements) {
				return acc;
			}

			const musicTrackDeviceId = track.elements[6].elements[0].attributes.uid;

			acc[musicTrackDeviceId] = {
				musicTrackDeviceId,
				deviceClassId: track.elements[1].attributes.uid,
				deviceName: track.elements[2].attributes.name,
				deviceUID: track.elements[2].elements[0].attributes.uid,
				deviceCategory: track.elements[3].elements[0].attributes.category,
				deviceSubCategory: track.elements[3].elements[0].attributes.subCategory,
				deviceBaseName: track.elements[3].elements[0].attributes.name,
				presetPath: track.elements[5].attributes.text,
				presetFileName:
					track.elements[5].attributes.text.match(/Presets\/.*\/(.*)/)[1],
			};

			return acc;
		}, {});

	return formattedAudioSynthFolderData;
}

function getMusicTrackDeviceData() {
	const musicTrackDeviceDataXml = fs.readFileSync(
		"songContents/Devices/musictrackdevice.xml",
		"utf-8"
	);
	const musicTrackDeviceData = JSON.parse(
		convert.xml2json(musicTrackDeviceDataXml)
	);

	const formattedMusicTrackDeviceData =
		musicTrackDeviceData.elements[0].elements[0].elements[0].elements.reduce(
			(acc, track) => {
				const musicTrackDeviceId =
					track.elements[0].attributes?.objectID?.match(/(.*)\/Input/)?.[1];

				if (!musicTrackDeviceId) {
					return acc;
				}

				acc[musicTrackDeviceId] = {
					...track.attributes,
					musicTrackDeviceId,
					songId: track.elements[1].attributes.uid,
				};

				return acc;
			},
			{}
		);

	return formattedMusicTrackDeviceData;
}

function getProjectStructure() {
	return {
		songData: getSongData(),
		audioSynthFolderData: getAudioSynthFolderData(),
		musicTrackDeviceData: getMusicTrackDeviceData(),
	};
}

function combineData(jsonStructure) {
	const combined = Object.values(jsonStructure.audioSynthFolderData).reduce(
		(acc, item) => {
			const musicTrackDeviceEntry =
				jsonStructure.musicTrackDeviceData[item.musicTrackDeviceId];
			const songEntry =
				jsonStructure.songData.MediaTrack[musicTrackDeviceEntry.songId];

			acc[item.musicTrackDeviceId] = {
				...item,
				...musicTrackDeviceEntry,
				...songEntry,
			};

			return acc;
		},
		{}
	);

	return combined;
}

function buildPresets(combinedData, jsonStructure) {
	for (const preset of Object.values(combinedData)) {
		if (!fs.existsSync("tempPreset")) {
			fs.mkdirSync("tempPreset");
		}
		fs.copyFileSync(
			`songContents/${preset.presetPath}`,
			`tempPreset/${preset.presetFileName}`
		);

		const metainfo = {
			elements: [
				{
					type: "element",
					name: "MetaInformation",
					elements: [
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Class:ID",
								value: preset.deviceClassId,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Class:Name",
								value: preset.deviceBaseName,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Class:Category",
								value: preset.deviceCategory,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Class:SubCategory",
								value: preset.deviceSubCategory,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "DeviceSlot:deviceName",
								value: preset.deviceName,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "DeviceSlot:deviceUID",
								value: preset.deviceUID,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "DeviceSlot:slotUID",
								value: preset.trackID,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Document:Title",
								value: preset.name,
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Document:Creator",
								value: "Berend",
							},
						},
						{
							type: "element",
							name: "Attribute",
							attributes: {
								id: "Document:Generator",
								value: "Studio One/6.0.0.89694",
							},
						},
					],
				},
			],
		};

		const metainfoXml = convert.js2xml(metainfo, {
			indentAttributes: true,
			indentCdata: true,
		});
		fs.writeFileSync("tempPreset/metainfo.xml", metainfoXml);

		const presetParts = {
			declaration: { attributes: { version: "1.0", encoding: "utf-8" } },
			elements: [
				{
					type: "element",
					name: "PresetParts",
					elements: [
						{
							type: "element",
							name: "PresetPart",
							elements: [
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "Class:ID",
										value: preset.deviceClassId,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "Class:Name",
										value: preset.deviceBaseName,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "Class:Category",
										value: preset.deviceCategory,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "Class:SubCategory",
										value: preset.deviceSubCategory,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "DeviceSlot:deviceName",
										value: preset.deviceName,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "DeviceSlot:deviceUID",
										value: preset.deviceUID,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "DeviceSlot:slotUID",
										value: preset.trackID,
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "AudioSynth:IsMainPreset",
										value: "1",
									},
								},
								{
									type: "element",
									name: "Attribute",
									attributes: {
										id: "Preset:DataFile",
										value: preset.presetFileName,
									},
								},
							],
						},
					],
				},
			],
		};

		const presetPartsXml = convert.js2xml(presetParts, {
			indentAttributes: true,
			indentCdata: true,
		});
		fs.writeFileSync("tempPreset/presetparts.xml", presetPartsXml);

		function getFolderStructure(preset) {
			function findFolders(item) {
				let folders = [];

				if (item.parentFolder) {
					const parentFolder =
						jsonStructure.songData.FolderTrack[item.parentFolder];
					folders.push(parentFolder.name);
					folders = folders.concat(findFolders(parentFolder));
				}

				return folders;
			}

			const structure = findFolders(preset);

			return structure.reverse();
		}

		const folderStructure = `exported/${getFolderStructure(preset).join("/")}`;

		if (!fs.existsSync(folderStructure)) {
			fs.mkdirSync(folderStructure, { recursive: true });
		}

		zipper.sync
			.zip("tempPreset")
			.compress()
			.save(`${folderStructure}/${preset.name.replace('"', ' inch')}.instrument`);

		fs.rmSync("tempPreset", { recursive: true, force: true });

		let awd;
	}
}

function main() {
	// extractProject();

	const jsonStructure = getProjectStructure();
	const combinedData = combineData(jsonStructure);

	buildPresets(combinedData, jsonStructure);

	console.log(Object.entries(combinedData).length);
}

main();
