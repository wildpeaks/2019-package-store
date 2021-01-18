/* eslint-env node */
/* eslint-disable max-len */
/* eslint-disable prefer-arrow-callback */
/* global document */
/* global window */
import {strictEqual, deepStrictEqual} from "assert";
import {before, after, describe, it} from "mocha";
import {chromium, firefox, webkit, BrowserType, Browser} from "playwright";
const {join, relative} = require("path");
const {mkdirSync} = require("fs");
const express = require("express");
const webpack = require("webpack");
const rimraf = require("rimraf");
const rreaddir = require("recursive-readdir");
const getWebpackConfig = require("@wildpeaks/webpack-config-web");

const rootFolder = join(__dirname, "fixtures");
const outputFolder = join(__dirname, "../out");

async function sleep(duration: number = 200): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}

async function compile(config: any): Promise<any> {
	return new Promise((resolve, reject) => {
		webpack(config, (err: any, stats: any) => {
			if (err) {
				reject(err);
			} else {
				resolve(stats);
			}
		});
	});
}

async function resetOutput(): Promise<void> {
	return new Promise((resolve) => {
		rimraf(outputFolder, () => {
			mkdirSync(outputFolder);
			resolve();
		});
	});
}

async function testFixture(options: any): Promise<string[]> {
	await resetOutput();

	const config = getWebpackConfig(options);
	strictEqual(typeof options, "object", "options is an Object");

	const stats = await compile(config);
	deepStrictEqual(stats.compilation.errors, [], "No compilation errors");

	let actualFiles: string[] = await rreaddir(outputFolder);
	actualFiles = actualFiles.map((filepath) => relative(outputFolder, filepath).replace(/\\/gu, "/"));
	return actualFiles;
}

let server: any;
let port = 0;
async function startExpress(): Promise<number> {
	return new Promise((resolve) => {
		const app = express();
		app.use(express.static(outputFolder));
		server = app.listen(0, () => {
			resolve(server.address().port);
		});
	});
}
async function stopExpress(): Promise<void> {
	return new Promise((resolve) => {
		server.close(() => {
			resolve();
		});
	});
}
before(async function (): Promise<void> {
	port = await startExpress();
});
after(async function (): Promise<void> {
	await stopExpress();
});


//---------------------------------------------------------------------------//
// Basic
//---------------------------------------------------------------------------//
async function testBasic(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const actual: any[] = [];
		await page.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto(`http://localhost:${port}/`);
		await sleep(1000);

		const expected = [
			{text1: "Count: 2000", text2: "Lines: Initial message 1,Initial message 2"},
			{text1: "Count: 2001", text2: "Lines: Initial message 1,Initial message 2"},
			{
				text1: "Count: 2001",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1,[250ms after] COUNT 2001 + 10"
			}
		];
		deepStrictEqual(actual, expected, "Props");
	} finally {
		await browser.close();
	}
}
describe("Basic", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./basic/myapp.ts"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testBasic(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testBasic(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testBasic(webkit);
	});
});


//---------------------------------------------------------------------------//
// Webworker
//---------------------------------------------------------------------------//
async function testWebworker(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const actual: any[] = [];
		await page.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto(`http://localhost:${port}/`);
		await sleep(1000);

		const expected = [
			{text1: "Count: 2000", text2: "Lines: Initial message 1,Initial message 2"},
			{text1: "Count: 2001", text2: "Lines: Initial message 1,Initial message 2"},
			{
				text1: "Count: 2001",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2: "Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2:
					"Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10"
			},
			{
				text1: "Count: 2011",
				text2:
					"Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted"
			},
			{
				text1: "Count: 2011",
				text2:
					"Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON"
			},
			{
				text1: "Count: 2011",
				text2:
					"Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1"
			},
			{
				text1: "Count: 2011",
				text2:
					"Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1,[250ms after] COUNT 2001 + 10"
			}
		];
		deepStrictEqual(actual, expected, "Props");
	} finally {
		await browser.close();
	}
}
describe("Webworker", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./webworker/myapp.ts"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map", "store.webworker.js", "store.webworker.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testWebworker(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testWebworker(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testWebworker(webkit);
	});
});


//---------------------------------------------------------------------------//
// Shared Action
//---------------------------------------------------------------------------//
async function testSharedAction(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();

		const actual1: any[] = [];
		const page1 = await context.newPage();
		await page1.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual1.push(parsed);
		});
		await page1.goto(`http://localhost:${port}/first.html`);
		await sleep();
		const expected1 = [
			{first: "Count: 1000, Hello: FIRST APP"},
			{first: "Count: 1001, Hello: FIRST APP"},
			{first: "Count: 1011, Hello: FIRST APP"}
		];
		deepStrictEqual(actual1, expected1, "Props (first)");

		const actual2: any[] = [];
		const page2 = await browser.newPage();
		await page2.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual2.push(parsed);
		});
		await page2.goto(`http://localhost:${port}/second.html`);
		await sleep();
		const expected2 = [
			{second: "Count: 2000, Hello: second app"},
			{second: "Count: 2002, Hello: second app"},
			{second: "Count: 2022, Hello: second app"}
		];
		deepStrictEqual(actual2, expected2, "Props (second)");
	} finally {
		await browser.close();
	}
}
describe("Shared Action", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				first: "./shared/app1.ts",
				second: "./shared/app2.ts"
			},
			pages: [
				{filename: "first.html", chunks: ["first"]},
				{filename: "second.html", chunks: ["second"]}
			]
		});
		const expectedFiles = ["first.html", "first.js", "first.js.map", "second.html", "second.js", "second.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testSharedAction(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testSharedAction(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testSharedAction(webkit);
	});
});


//---------------------------------------------------------------------------//
// Multiple Stores
//---------------------------------------------------------------------------//
async function testMultipleStores(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const actual: any[] = [];
		await page.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto(`http://localhost:${port}/`);
		await sleep();

		const expected: any[] = [
			{first: "Count: 123"},
			{second: "Text: Initial message 1, Initial message 2"},
			{first: "Count: 124"},
			{second: "Text: Initial message 1, Initial message 2, Hello"},
			{first: "Count: 134"},
			{second: "Text: Initial message 1, Initial message 2, Hello, World"}
		];
		deepStrictEqual(actual, expected, "Props");
	} finally {
		await browser.close();
	}
}
describe("Multiple Stores", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./multiple/myapp.ts"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testMultipleStores(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testMultipleStores(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testMultipleStores(webkit);
	});
});


//---------------------------------------------------------------------------//
// Preact Render
//---------------------------------------------------------------------------//
async function testPreactRender(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto(`http://localhost:${port}/`);
		await sleep();

		const result1 = await page.evaluate(() => {
			const el = document.getElementById("hello");
			if (el === null) {
				return "#hello not found";
			}
			if (el.innerHTML !== '<div style="color: green;">Title is Count: 2000</div>') {
				return `Bad #hello.innerHTML: ${el.innerHTML}`;
			}
			return "ok";
		});
		strictEqual(result1, "ok", "Before @add");

		const result2 = await page.evaluate(() => {
			let throws = false;
			try {
				// @ts-ignore
				window.MOCHA_STORE.schedule({
					action: "add",
					toAdd: 123
				});
			} catch (e) {
				throws = e;
			}
			if (throws !== false) {
				return `Action throws: ${throws}`;
			}
			return "ok";
		});
		strictEqual(result2, "ok", "Called @add");

		await sleep();
		const result3 = await page.evaluate(() => {
			const el = document.getElementById("hello");
			if (el === null) {
				return "#hello not found";
			}
			if (el.innerHTML !== '<div style="color: green;">Title is Count: 2123</div>') {
				return `Bad #hello.innerHTML: ${el.innerHTML}`;
			}
			return "ok";
		});
		strictEqual(result3, "ok", "After @add");
	} finally {
		await browser.close();
	}
}
describe("Preact Render", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./preact-render/myapp.tsx"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testPreactRender(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testPreactRender(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testPreactRender(webkit);
	});
});


//---------------------------------------------------------------------------//
// Collection
//---------------------------------------------------------------------------//
async function testCollection(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const actual: any[] = [];
		await page.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto(`http://localhost:${port}/`);
		await sleep();

		const expected: any[] = [
			{
				initial1: {position: "1 0 0"},
				initial2: {position: "2 0 0"},
				initial3: {position: "3 0 0"}
			},
			{
				initial1: {position: "1 0 0"},
				initial2: {position: "2 0 0"},
				initial3: {position: "3 0 0"},
				new1: {position: "4 0 0"}
			},
			{
				initial1: {position: "1 0 0"},
				initial2: {position: "2 0 0"},
				initial3: {position: "3 0 0"},
				new1: {position: "4 0 0"},
				new2: {position: "5 0 0"}
			}
		];
		deepStrictEqual(actual, expected, "Props");
	} finally {
		await browser.close();
	}
}
describe("Collection", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./collection/myapp.ts"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testCollection(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testCollection(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testCollection(webkit);
	});
});


//---------------------------------------------------------------------------//
// Nested Collection
//---------------------------------------------------------------------------//
async function testNestedCollection(host: BrowserType<Browser>): Promise<void> {
	const browser = await host.launch();
	try {
		const actual: any[] = [];
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.exposeFunction("MOCHA_ON_STORE_PROPS", (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto(`http://localhost:${port}/`);
		await sleep();

		const expected: any[] = [
			{
				selected: "",
				ids: ["initial1", "initial2", "initial3"]
			},
			{
				selected: "initial2",
				ids: ["initial1", "initial2", "initial3"],
				viewpoint: {
					position: "2 0 0"
				}
			},
			{
				selected: "initial2",
				ids: ["initial1", "initial2", "initial3", "new1"],
				viewpoint: {
					position: "2 0 0"
				}
			},
			{
				selected: "initial2",
				ids: ["initial1", "initial2", "initial3", "new1", "new2"],
				viewpoint: {
					position: "2 0 0"
				}
			},
			{
				selected: "new1",
				ids: ["initial1", "initial2", "initial3", "new1", "new2"],
				viewpoint: {
					position: "4 0 0"
				}
			}
		];
		deepStrictEqual(actual, expected, "Props");
	} finally {
		await browser.close();
	}
}
describe("Nested Collection", function () {
	before("Compile", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		const actualFiles = await testFixture({
			rootFolder,
			outputFolder,
			mode: "development",
			entry: {
				myapp: "./nested/myapp.ts"
			}
		});
		const expectedFiles = ["index.html", "myapp.js", "myapp.js.map"];
		deepStrictEqual(actualFiles.sort(), expectedFiles.sort(), "Compiled files");
	});
	it("Chromium", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testNestedCollection(chromium);
	});
	it("Firefox", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testNestedCollection(firefox);
	});
	it("Webkit", /* @this */ async function (): Promise<void> {
		this.slow(5000);
		this.timeout(15000);
		await testNestedCollection(webkit);
	});
});
