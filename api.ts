import { log } from "@clack/prompts";
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

	// fill the birthday if empty
	if (
		!(await page.$eval(
			"#MonthDropdown",
			(el) => (el as HTMLSelectElement).value,
		))
	) {
		await page.type("#MonthDropdown", "january");
	}
	if (
		!(await page.$eval("#DayDropdown", (el) => (el as HTMLSelectElement).value))
	) {
		await page.type("#DayDropdown", "1");
	}
	if (
		!(await page.$eval(
			"#YearDropdown",
			(el) => (el as HTMLSelectElement).value,
		))
	) {
		await page.type("#YearDropdown", "2000");
	}

	// clear and enter password
	const input = await page.$("#signup-password");
	if (!input) {
		throw new Error("Couldn't find the password input");
	}
	await input?.click({ count: 2 });
	await input.type("password", { delay: 2 });

	// fill the username
	const usernameInput = await page.$("#signup-username");
	if (!usernameInput) {
		throw new Error("Couldn't find the username input");
	}
	await usernameInput.click({ count: 2 });
	await usernameInput.type(name, { delay: 2 });

	let usernameRes: { valid: boolean; err?: string } = {
		valid: false,
		err: "something unknown happened",
	};
	await new Promise<void>((resolve) => {
		page.on("requestfinished", async (request) => {
			const response = request.response();

			if (!response) return;

			if (request.redirectChain().length === 0) {
				const responseBody = await response.json().catch(() => null);
				if (responseBody && [0, 1, 2].includes(responseBody.code)) {
					usernameRes = {
						valid: responseBody.code === 0,
						err: responseBody.code !== 0 ? responseBody.message : undefined,
					};
					page.removeAllListeners("requestfinished");
					resolve();
				}
			}
		});
	});

	return usernameRes;
}
