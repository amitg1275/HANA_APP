/*eslint no-console: 0, no-unused-vars: 0, consistent-return: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
let express = require("express");
let app = express.Router();
let os = require("os");
let TextBundle = require("@sap/textbundle").TextBundle;

function getLocale(req) {
	let langparser = require("accept-language-parser");
	let lang = req.headers["accept-language"];
	if (!lang) {
		return null;
	}
	let arr = langparser.parse(lang);
	if (!arr || arr.length < 1) {
		return null;
	}
	let locale = arr[0].code;
	if (arr[0].region) {
		locale += "_" + arr[0].region;
	}
	return locale;
}

module.exports = function () {

	app.get("/", (req, res) => {
		let bundle = new TextBundle(global.__base + "i18n/messages", getLocale(req));
		res.writeHead(200, {
			"Content-Type": "text/plain; charset=utf-8"
		});
		let greeting = bundle.getText("greeting", [os.hostname(), os.type()]);
		res.end(greeting, "utf-8");
	});
	return app;
};