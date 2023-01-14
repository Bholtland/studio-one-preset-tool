import fs from "fs";
import zipper from "zip-local";
import convert from "xml-js";

export function createPreset(preset, jsonStructure) {
	return new Promise((resolve, reject) => {
		fs.mkdirSync(`./temp/${preset.songId}`, { recursive: true });

		fs.copyFileSync(
			`./songContents/${preset.presetPath}`,
			`./temp/${preset.songId}/${preset.presetFileName}`
		);

		const metainfo = getMetaInfo(preset);
		const metainfoXml = convert.js2xml(metainfo, {
			indentAttributes: true,
			indentCdata: true,
		});
		fs.writeFileSync(`./temp/${preset.songId}/metainfo.xml`, metainfoXml);

		const presetParts = getPresetParts(preset);
		const presetPartsXml = convert.js2xml(presetParts, {
			indentAttributes: true,
			indentCdata: true,
		});

		fs.writeFileSync(`./temp/${preset.songId}/presetparts.xml`, presetPartsXml);

		const folderStructure = `./exported/${getFolderStructure(
			preset,
			jsonStructure
		).join("/")}`;

		if (!fs.existsSync(folderStructure)) {
			fs.mkdirSync(folderStructure, { recursive: true });
		}

		zipper.sync
			.zip(`./temp/${preset.songId}`)
			.compress()
			.save(
				`${folderStructure}/${preset.name.replace('"', " inch")}.instrument`
			);

		// if (fs.existsSync(`./temp/${preset.songId}`)) {
		// 	fs.rmSync(`./temp/${preset.songId}`, { recursive: true, force: true });
		// }

		resolve(true);
	});
}

function getFolderStructure(preset, jsonStructure) {
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

function getMetaInfo(preset) {
	return {
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
}

function getPresetParts(preset) {
	return {
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
}
