import fs from "fs";
import convert from "xml-js";

function getFileData(filePath, converter) {
	const fileXml = fs.readFileSync(filePath, "utf-8");
	const file = JSON.parse(convert.xml2json(fileXml));

	return converter(file);
}

export function getSongData(config) {
	function convert(file) {
		return file.elements[0].elements[0].elements[1].elements.reduce(
			(acc, track) => {
				if (!acc[track.name]) {
					acc[track.name] = {};
				}

				const trackId =
					track.name === "MediaTrack"
						? track.elements[0].attributes.uid
						: track.attributes.trackID;

				acc[track.name][trackId] = track.attributes;

				return acc;
			},
			{}
		);
	}

	return getFileData(`${config.in.path}/songContents/Song/song.xml`, convert);
}

export function getAudioSynthFolderData(config) {
	function convert(file) {
		return file.elements[0].elements.reduce((acc, track) => {
			if (!track.elements?.length || !track.elements[6].elements?.length) {
				return acc;
			}

			const musicTrackDeviceId = track.elements[6].elements[0]?.attributes?.uid;

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
	}

	return getFileData(
		`${config.in.path}/songContents/Devices/audiosynthfolder.xml`,
		convert
	);
}

export function getMusicTrackDeviceData(config) {
	function convert(file) {
		return file.elements[0].elements[0].elements[0].elements.reduce(
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
	}

	return getFileData(
		`${config.in.path}/songContents/Devices/musictrackdevice.xml`,
		convert
	);
}

export function getProjectStructure(config) {
	return {
		songData: getSongData(config),
		audioSynthFolderData: getAudioSynthFolderData(config),
		musicTrackDeviceData: getMusicTrackDeviceData(config),
	};
}

export function combineData(jsonStructure) {
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
