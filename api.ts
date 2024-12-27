import type { Browser } from "puppeteer";

import { decode } from "he";
import { genRandom } from "./utils";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export class DirectAPIClient {
	csrfToken: string | undefined;
	birthday = `${genRandom(1991, 2006)}-0${genRandom(2, 9)}-0${genRandom(2, 9)}T12:00:00.000Z`;
	private async setCsrfToken() {
		const res = await fetch("https://roblox.com", {
			headers: {
				"User-Agent": USER_AGENT
			}
		});
		if (!res.ok) throw Error("Failed to request https://roblox.com");
		const text = await res.text();

		this.csrfToken = decode(text.match(/(?<=\<meta name=\"csrf-token\" data-token=\").*(?=\" \/\>)/gm)![0]);
		if (!this.csrfToken) throw Error("CSRF token not found in response");
		return this.csrfToken;
	}
	async validateUsername(username: string, attempts: number = 0): Promise<{
		valid: boolean,
		err: string | undefined,
	}> {
		let csrfToken = this.csrfToken;
		while (!csrfToken) {
			csrfToken = await this.setCsrfToken();
		}

		const res = await fetch("https://auth.roblox.com/v1/usernames/validate", {
			method: "POST",
			headers: {
				"User-Agent": USER_AGENT,
				"Content-Type": "application/json;charset=utf-8",
				"Origin": "https://www.roblox.com",
				"Referer": "https://www.roblox.com/",
				"x-csrf-token": csrfToken
			},
			body: JSON.stringify({
				username,
				context: "Signup",
				birthday: this.birthday
			})
		});
		const responseBody = await res.json();
		if (!res.ok) {
			if(attempts >= 2) throw Error("Failed to request username validation");
			else {
				await this.setCsrfToken();
				return await this.validateUsername(username, attempts + 1);
			}
		};
		return {
			valid: responseBody.code === 0,
			err: responseBody.code !== 0 ? responseBody.message : undefined,
		};
	}
}

const client = new DirectAPIClient();

export async function validateUsername({
	method,
	browser,
	name
}: {
	method: "classic",
	browser: Browser
	name: string
} | {
	method: "api",
	name: string
	browser: null | undefined
}): Promise<{ valid: boolean; err?: string }> {
	if (method === "api") return client.validateUsername(name);
	else {
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
}
