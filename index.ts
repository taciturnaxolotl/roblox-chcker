import { intro, outro, text, spinner, log, isCancel } from "@clack/prompts";
import puppeteer from "puppeteer";

import { validateUsername } from "./api";

const browser = await puppeteer.launch({ headless: false });

intro("Roblox Chcker");

const username = await text({
	message: "Enter a list of names to check sepperated by commas:",
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

const names = username
	.toString()
	.split(",")
	.map((name) => name.trim())
	.filter((name) => name.length > 0);

const s = spinner();

s.start("Checking...");

const results: {
	name: string;
	valid: boolean;
	err?: string;
}[] = [];

for (const name of names) {
	const { valid, err } = await validateUsername(browser, name);

	if (!valid) {
		s.message(`${name} isn't valid: ${err}`);
	} else {
		s.message(`${name} is valid`);
	}

	results.push({ name, valid, err });
}

s.stop(
	`Checked ${names.length} names with ${results.filter((r) => r.valid).length} valid names`,
);

outro("Bye!");

await browser.close();
