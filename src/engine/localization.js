const supportedLanguages = [
	"english",
	"czech",
	"danish",
	"dutch",
	"finnish",
	"french",
	"german",
	"hungarian",
	"indonesian",
	"italian",
	"norwegian",
	"polish",
	"portuguese",
	"brazilian",
	"romanian",
	"spanish",
	"latam",
	"swedish",
	"turkish"
]

// Load localization.
const localization = {}
for (const lang of supportedLanguages)
{
	const path = `loc/${lang}.json`
	localization[lang] = ccbFileExist(path) ? JSON.parse(ccbReadFileContent(path)) : {}
}

global.currentLanguage = "english"
global.localize = function(string, ...replaceStrings){
	let keyInLoc = currentLanguage in localization &&
		string in localization[currentLanguage] &&
		localization[currentLanguage][string] != ""
	let loc = localization[keyInLoc ? currentLanguage : "english"]
	if (keyInLoc || string in loc)
	{
		let localizedString = loc[string]
		let replacements = localizedString.match(/{[0-9]*?}/g)
		if (replacements)
			for (const str of replacements)
			{
				let index = parseInt(str.substring(1, str.length - 1))
				if (index && index > 0 && index <= replaceStrings.length)
					localizedString = localizedString.replace(str, replaceStrings[index - 1])
			}
		return localizedString
	}
	return string
}