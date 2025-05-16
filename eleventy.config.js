
export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_components");
  eleventyConfig.setOutputDirectory("docs");
	eleventyConfig.setTemplateFormats("html,liquid");
};
