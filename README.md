# Store

[![Build Status](https://travis-ci.org/wildpeaks/package-actions-worker.svg?branch=master)](https://travis-ci.org/wildpeaks/package-actions-worker)

Tiny Typescript class to store an **immutable state** that can be edited using **JSON messages** actions,
and **emits JSON props on state change**.

It can be used with or without a Web Worker.

When the state is replaced, it extracts JSON props to emit.
That way, when the application state is managed in a Web Worker that emits props back to the main thread,
only the data needed for rendering (the props) are sent to the UI thread.
Also, it can avoid bothering the main thread if the state change is not significant enough that the props changed.

Also, given actions and props are all JSON, the history of interactions could be recorded, replayed, and tested.

See examples in the [/test/fixtures](https://github.com/wildpeaks/package-store/tree/master/test/fixtures) folder.


-------------------------------------------------------------------------------

## Actions

Actions are functions that receive two parameters:
 - the message: any JSON-encodable object as long as it has a string property `action`
 - a reference to the Store

The `IStore` store reference has two generics:
 - your State type
 - the type of additional messages it can schedule (or `never`)

The `store.state` is used to read and modify.

However, **only one (immediate) change is allowed per action**.
Any additional or async changes should be actions scheduled using `store.schedule`.


---
### Example

Let's say we have an application with two actions:
 - `log` that adds a line to a string[]
 - `add` that increments a number

The message types:

````ts
type LogMessage = Readonly<{
	action: 'log';
	text: string;
}>;

type AddMessage = Readonly<{
	action: 'add';
	toAdd: number;
}>;
````

The `log` action only makes one change:

````ts
import {IStore} from '@wildpeaks/store';

export type PartialState = {
	messages: string[];
};

export function actionLog<State extends PartialState>(message: LogMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newMessages = oldState.messages.concat([message.text]);
	const newState = Object.assign({}, oldState, {messages: newMessages});
	Object.freeze(newState); // optional
	store.state = newState;
}
````

The `add` action makes one change and schedules two `log` actions:

````ts
import {IStore} from '@wildpeaks/store';

export type PartialState = {
	count: number;
};

export function actionAdd<State extends PartialState>(message: AddMessage, store: IStore<State, LogMessage>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count + message.toAdd});
	store.state = newState;

	store.schedule({
		action: 'log',
		text: 'immediately after'
	});

	setTimeout(() => {
		store.schedule({
			action: 'log',
			text: '250ms after'
		});
	}, 250);
}
````

Note how `PartialState` is used to specify only the parts of State that the action relies on.
This way, the action could be used with multiple State types as long as they include the properties that the action relies on.


-------------------------------------------------------------------------------

## Store

The `Store` class takes three generics:
 - State type of the data it stores
 - Props type of the JSON it emits
 - Messages of actions it might receive

Store methods:
 - `store.register` adds an action
 - `store.unregister` removes an action
 - `store.schedule` receives messages
 - `store.serialize` generates a Props object given an arbitrary State

Store properties:
 - `store.state` reads and replaces the current immutable state
 - `store.onprops` is called when props have changed


### Example

Let's continue the example that has two actions (`log` and `add`).
Now that the actions and messages are defined, time to create a Store and use it.

````ts
// Internal state in the webworker
type State = Readonly<{
	count: number;
	messages: string[];
}>;

// JSON sent to the main thread
type Props = Readonly<{
	text1: string;
	text2: string;
}>;

// Create the Store instance
import {Store} from '@wildpeaks/store';
type Messages = LogMessage | AddMessage;
const mystore = new Store<State, Props, Messages>();

// Register actions
mystore.register('log', actionLog);
mystore.register('add', actionAdd);

// Converts State to Props
mystore.serialize = state => {
	const props: Props = {
		text1: `Count is ${state.count}`,
		text2: `There are ${state.messages.length} lines`
	};
	Object.freeze(props); // optional
	return props;
};

// Subscribe to props
mystore.onprops = props => {
	console.log('Render', props);
};

// Set the initial state
mystore.state = {
	count: 123,
	messages: [
		'Initial message 1',
		'Initial message 2'
	]
};

// Send an action
mystore.schedule({
	action: 'log',
	text: 'Hello'
});
````
