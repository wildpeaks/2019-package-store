/* eslint-env node, jasmine */
/* eslint-disable max-len */
'use strict';
const {join, relative} = require('path');
const {readFileSync, mkdirSync} = require('fs');
const express = require('express');
const webpack = require('webpack');
const rimraf = require('rimraf');
const rreaddir = require('recursive-readdir');
const puppeteer = require('puppeteer');
const getWebpackConfig = require('@wildpeaks/webpack-config-web');


// const getConfig = require('..');
const rootFolder = join(__dirname, 'fixtures');
const outputFolder = join(__dirname, '../out');
let app: any;
let server: any;


/**
 * @param duration
 */
function sleep(duration: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}


/**
 * @param config
 */
function compile(config: any): Promise<any> {
	return new Promise((resolve, reject) => {
		webpack(config, (err: any, stats: any) => {
			if (err){
				reject(err);
			} else {
				resolve(stats);
			}
		});
	});
}


/**
 * @param options
 * @returns {String[]}
 */
async function testFixture(options: any): Promise<string[]> {
	const config = getWebpackConfig(options);
	expect(typeof options).toBe('object');

	const stats = await compile(config);
	expect(stats.compilation.errors).toEqual([]);

	let actualFiles: string[] = await rreaddir(outputFolder);
	actualFiles = actualFiles.map(filepath => relative(outputFolder, filepath).replace(/\\/g, '/'));
	return actualFiles;
}


beforeAll(() => {
	app = express();
	app.use(express.static(outputFolder));
	server = app.listen(8888);
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
});

afterAll(done => {
	server.close(() => {
		done();
	});
});

beforeEach(done => {
	rimraf(outputFolder, () => {
		mkdirSync(outputFolder);
		done();
	});
});


it('Basic', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			myapp: './basic/myapp.ts'
		}
	});
	const expectedFiles = [
		'index.html',
		'myapp.js',
		'myapp.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/');
		await sleep(1000);

		const expected = [
			{text1: 'Count: 2000', text2: 'Lines: Initial message 1,Initial message 2'},
			{text1: 'Count: 2001', text2: 'Lines: Initial message 1,Initial message 2'},
			{text1: 'Count: 2001', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1,[250ms after] COUNT 2001 + 10'}
		];
		expect(actual).toEqual(expected, 'Props');
	} finally {
		await browser.close();
	}
});


it('Webworker', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			myapp: './webworker/myapp.ts'
		}
	});
	const expectedFiles = [
		'index.html',
		'myapp.js',
		'myapp.js.map',
		'store.webworker.js',
		'store.webworker.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/');
		await sleep(1000);

		// Same as single-thread fixture
		const expected = [
			{text1: 'Count: 2000', text2: 'Lines: Initial message 1,Initial message 2'},
			{text1: 'Count: 2001', text2: 'Lines: Initial message 1,Initial message 2'},
			{text1: 'Count: 2001', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1'},
			{text1: 'Count: 2011', text2: 'Lines: Initial message 1,Initial message 2,[immediately after] COUNT 2000 + 1,[immediately after] COUNT 2001 + 10,Hello Formatted,Hello JSON,[250ms after] COUNT 2000 + 1,[250ms after] COUNT 2001 + 10'}
		];
		expect(actual).toEqual(expected, 'Props');
	} finally {
		await browser.close();
	}
});


it('Shared action', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			first: './shared/app1.ts',
			second: './shared/app2.ts'
		},
		pages: [
			{filename: 'first.html', chunks: ['first']},
			{filename: 'second.html', chunks: ['second']}
		]
	});
	const expectedFiles = [
		'first.html',
		'first.js',
		'first.js.map',
		'second.html',
		'second.js',
		'second.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser1 = await puppeteer.launch();
	try {
		const page = await browser1.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/first.html');
		await sleep(1000);

		const expected = [
			{first: 'Count: 1000, Hello: FIRST APP'},
			{first: 'Count: 1001, Hello: FIRST APP'},
			{first: 'Count: 1011, Hello: FIRST APP'}
		];
		expect(actual).toEqual(expected, 'Props (first)');
	} finally {
		await browser1.close();
	}

	const browser2 = await puppeteer.launch();
	try {
		const page = await browser2.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/second.html');
		await sleep(1000);

		const expected = [
			{second: 'Count: 2000, Hello: second app'},
			{second: 'Count: 2002, Hello: second app'},
			{second: 'Count: 2022, Hello: second app'}
		];
		expect(actual).toEqual(expected, 'Props (second)');
	} finally {
		await browser2.close();
	}
});


it('Multiple Stores', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			myapp: './multiple/myapp.ts'
		}
	});
	const expectedFiles = [
		'index.html',
		'myapp.js',
		'myapp.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/');
		await sleep(1000);

		const expected: any[] = [
			{first: 'Count: 123'},
			{second: 'Text: Initial message 1, Initial message 2'},
			{first: 'Count: 124'},
			{second: 'Text: Initial message 1, Initial message 2, Hello'},
			{first: 'Count: 134'},
			{second: 'Text: Initial message 1, Initial message 2, Hello, World'}
		];
		expect(actual).toEqual(expected, 'Props');
	} finally {
		await browser.close();
	}
});


it('Preact Render', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			myapp: './preact-render/myapp.tsx'
		}
	});
	const expectedFiles = [
		'index.html',
		'myapp.js',
		'myapp.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();
		await page.goto('http://localhost:8888/');
		await sleep(200);

		const result1 = await page.evaluate(() => {
			/* global document */
			const el = document.getElementById('hello');
			if (el === null){
				return '#hello not found';
			}
			if (el.innerHTML !== '<div style="color: green;">Title is Count: 2000</div>'){
				return `Bad #hello.innerHTML: ${el.innerHTML}`;
			}
			return 'ok';
		});
		expect(result1).toBe('ok', 'Before @add');

		const result2 = await page.evaluate(() => {
			let throws = false;
			try {
				// @ts-ignore
				window.PUPPETEER_STORE.schedule({
					action: 'add',
					toAdd: 123
				});
			} catch(e){
				throws = e;
			}
			if (throws !== false){
				return `Action throws: ${throws}`;
			}
			return 'ok';
		});
		expect(result2).toBe('ok', 'Called @add');

		await sleep(200);
		const result3 = await page.evaluate(() => {
			/* global document */
			const el = document.getElementById('hello');
			if (el === null){
				return '#hello not found';
			}
			if (el.innerHTML !== '<div style="color: green;">Title is Count: 2123</div>'){
				return `Bad #hello.innerHTML: ${el.innerHTML}`;
			}
			return 'ok';
		});
		expect(result3).toBe('ok', 'After @add');

	} finally {
		await browser.close();
	}
});


it('Collection', async() => {
	const actualFiles = await testFixture({
		rootFolder,
		outputFolder,
		mode: 'development',
		entry: {
			myapp: './collection/myapp.ts'
		}
	});
	const expectedFiles = [
		'index.html',
		'myapp.js',
		'myapp.js.map'
	];
	expect(actualFiles.sort()).toEqual(expectedFiles.sort());

	const browser = await puppeteer.launch();
	try {
		const page = await browser.newPage();

		const actual: any[] = [];
		await page.exposeFunction('PUPPETER_ON_PROPS', (stringified: string) => {
			const parsed = JSON.parse(stringified);
			actual.push(parsed);
		});
		await page.goto('http://localhost:8888/');
		await sleep(1000);

		const expected: any[] = [
			{
				initial1: {position: '1 0 0'},
				initial2: {position: '2 0 0'},
				initial3: {position: '3 0 0'}
			},
			{
				initial1: {position: '1 0 0'},
				initial2: {position: '2 0 0'},
				initial3: {position: '3 0 0'},
				new1: {position: '4 0 0'}
			},
			{
				initial1: {position: '1 0 0'},
				initial2: {position: '2 0 0'},
				initial3: {position: '3 0 0'},
				new1: {position: '4 0 0'},
				new2: {position: '5 0 0'}
			}
		];
		expect(actual).toEqual(expected, 'Props');
	} finally {
		await browser.close();
	}
});
