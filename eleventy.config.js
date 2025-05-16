
export default function(eleventyConfig) {
	eleventyConfig.setInputDirectory("src");
	eleventyConfig.setIncludesDirectory("_components");
	eleventyConfig.setOutputDirectory("docs");
	//eleventyConfig.setTemplateFormats("njk");
	eleventyConfig.addFilter("indent", function(value, tabs = 1) {
		console.log(tabs)
		const pad = "\t".repeat(tabs);
		return value
			.split("\r\n")
			.map(line => (line ? pad + line : line))
			.join("\r\n");
	});
};
