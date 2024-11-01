import type { Browser } from "puppeteer";

export async function validateUsername(
	browser: Browser,
	name: string,
): Promise<{ valid: boolean; err?: string }> {
	const pages = await browser.pages();
	const page = pages.length > 0 ? pages[0] : await browser.newPage();

	if (page.url() !== "https://www.roblox.com/") {
		await page.goto("https://www.roblox.com/");
	}
	await page.$(".header-title");

	// fill the birthday
	await page.type("#MonthDropdown", "january");
	await page.type("#DayDropdown", "1");
	await page.type("#YearDropdown", "2000");

	// enter password
	await page.type("#signup-password", "password");

	// fill the username
	await page.type("#signup-username", name);

	// wait for #signup-passwordInputValidation to change
	await page.waitForFunction(() => {
		const el = document.querySelector("#signup-usernameInputValidation");
		return el?.textContent ? el.textContent.length > 0 : false;
	});

	// get the #signup-usernameInputValidation p element text
	const errorText = await page.evaluate(() => {
		const el = document.querySelector("#signup-usernameInputValidation");
		return el ? el.textContent : "";
	});

	let returner: { valid: boolean; err?: string };
	// check if the username is valid
	if (errorText && errorText.length > 0) {
		returner = { valid: false, err: errorText };
	} else {
		returner = { valid: true };
	}

	return returner;
}
