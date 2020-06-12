/* eslint-env browser */
import {StoreWorker} from "../../..";
import {StoreProps} from "./types/StoreProps";
import {StoreMessage} from "./types/StoreMessage";
import {format as log} from "./messages/log";
import {format as add} from "./messages/add";

// Webworker provided by "worker-loader"
const MyWorker = require("./store.webworker");
const myworker: Worker = new MyWorker();

// Small wrapper to alias worker properties with the store types.
const mystore = new StoreWorker<StoreProps, StoreMessage>(myworker);
mystore.onprops = (props) => {
	const text = JSON.stringify(props);
	//@ts-ignore
	window.MOCHA_ON_STORE_PROPS(text); // eslint-disable-line
};

// Send actions using message formatters
mystore.schedule(add(1));
mystore.schedule(add(10));
mystore.schedule(log("Hello Formatted"));

// Send actions using JSON directly
mystore.schedule({
	action: "log",
	text: "Hello JSON"
});
