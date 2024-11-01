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
	await page.evaluate(() => {
		const passwordInput = document.querySelector(
			"#signup-password",
		) as HTMLInputElement;
		if (passwordInput) {
			passwordInput.value = "";
		}
	});
	await page.type("#signup-password", "password");

	// fill the username
	await page.evaluate(() => {
		const usernameInput = document.querySelector(
			"#signup-username",
		) as HTMLInputElement;
		if (usernameInput) {
			usernameInput.value = "";
		}
	});
	await page.type("#signup-username", name);

	let usernameRes: { valid: boolean; err?: string } = {
		valid: false,
		err: "something unknown happened",
	};
	await new Promise<void>((resolve) => {
		page.on("requestfinished", async (request) => {
			const response = request.response();

			if (!response) return;

			if (request.redirectChain().length === 0) {
				// Because body can only be accessed for non-redirect responses.
				const responseBody = await response.json().catch(() => null);
				if (responseBody) {
					if (responseBody.code === 1 || responseBody.code === 0) {
						usernameRes = {
							valid: responseBody.code === 0,
							err: responseBody.code === 1 ? responseBody.message : undefined,
						};

						page.removeAllListeners("requestfinished");
						resolve();
					}
				}
			}
		});
	});

	return usernameRes;
}
