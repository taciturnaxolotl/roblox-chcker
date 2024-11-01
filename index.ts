import { intro, outro, text, spinner, log, isCancel } from "@clack/prompts";
import puppeteer from "puppeteer";

import { validateUsername } from "./api";

const browser = await puppeteer.launch({ headless: false });

intro("Roblox Chcker");

const username = await text({
	message: "Enter the name to check:",
	validate(value) {
		if (value.length < 3) {
			return "Username is too short";
		}
	},
});

if (isCancel(username)) {
	outro("Bye!");
	await browser.close();
	process.exit(0);
}

const s = spinner();

s.start("Checking...");

const { valid, err } = await validateUsername(browser, username.toString());

if (!valid) {
	s.stop(`Username isn't valid: ${err}`, 1);
} else {
	s.stop("Username is valid");
}

outro("Bye!");

await browser.close();
