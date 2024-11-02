import {
	intro,
	outro,
	text,
	spinner,
	log,
	isCancel,
	select,
} from "@clack/prompts";
import puppeteer from "puppeteer";

import { validateUsername } from "./api";

const browser = await puppeteer.launch({ headless: false });

intro("Roblox Chcker");

const choice = await select({
	message: "What would you like to do?",
	options: [
		{ label: "Check a username", value: "check" },
		{ label: "Check a list of usernames", value: "check-list" },
		{ label: "Generate a list of usernames", value: "generate" },
		{ label: "Exit", value: "exit" },
	],
});

let username: string | symbol;

switch (choice) {
	case "check":
		username = await text({
			message: "Enter the username to check:",
			validate(value) {
				if (value.length < 3) {
					return "Username is too short";
				}
			},
		});

		break;
	case "check-list":
		username = await text({
			message: "Enter a list of names to check sepperated by commas:",
			validate(value) {
				if (value.length < 3) {
					return "Username is too short";
				}
			},
		});
		break;
	case "generate": {
		// get the length of username to generate
		const count = await text({
			message: "Enter the length of username to generate:",
			validate(value) {
				if (Number.isNaN(Number(value))) {
					return "Please enter a number";
				}
			},
		}).then((value) => Number(value));

		// generate every possible username combination
		const alphabet = "abcdefghijklmnopqrstuvwxyz";
		const usernames = [];
		for (let i = 0; i < count; i++) {
			for (let j = 0; j < alphabet.length; j++) {
				for (let k = 0; k < alphabet.length; k++) {
					usernames.push(`${alphabet[i]}${alphabet[j]}${alphabet[k]}`);
				}
			}
		}

		username = usernames.join(",");

		break;
	}
	default:
		outro("Bye!");
		await browser.close();
		process.exit(0);
}

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
	// check if Usernames may only contain letters, numbers, and _.
	// or Usernames can be 3 to 20 characters long.
	// or Usernames can't contain spaces.
	// or usernames can't contain more than one total underscore

	if (name.length < 3) {
		s.message(`${name} is too short`);
		results.push({ name, valid: false, err: "too short" });
		continue;
	}
	if (name.length > 20) {
		s.message(`${name} is too long`);
		results.push({ name, valid: false, err: "too long" });
		continue;
	}
	if (name.includes(" ")) {
		s.message(`${name} contains a space`);
		results.push({ name, valid: false, err: "contains a space" });
		continue;
	}
	if (name.includes("_")) {
		const underscoreCount = name.split("_").length - 1;
		if (underscoreCount > 1) {
			s.message(`${name} contains more than one underscore`);
			results.push({
				name,
				valid: false,
				err: "contains more than one underscore",
			});
			continue;
		}
	}

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

log.info(`Result${results.length > 1 ? "s" : ""}`);

for (const { name, valid, err } of results) {
	if (valid) {
		log.success(`${name} works!`);
	} else {
		log.warn(`${name}: ${err}`);
	}
}

outro("Bye!");

await browser.close();
