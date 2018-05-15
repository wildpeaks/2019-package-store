import {Store} from '../../..';
import {action as actionLog} from 'actions/log';
import {action as actionAdd} from 'actions/add';
import {Id as LogMessageId, Message as LogMessage, format as log} from 'messages/log';
import {Id as AddMessageId, Message as AddMessage, format as add} from 'messages/add';


// First store
type FirstState = Readonly<{
	count: number;
}>;
type FirstProps = Readonly<{
	first: string;
}>;
const mystore1 = new Store<FirstState, FirstProps, AddMessage>();
mystore1.register(AddMessageId, actionAdd);
mystore1.serialize = state => ({
	first: `Count: ${state.count}`
});


// Second store
type SecondState = Readonly<{
	messages: string[];
}>;
type SecondProps = Readonly<{
	second: string;
}>;
const mystore2 = new Store<SecondState, SecondProps, LogMessage>();
mystore2.register(LogMessageId, actionLog);
mystore2.serialize = state => ({
	second: `Text: ${state.messages.join(', ')}`
});


// Subscribe to props
mystore1.onprops = props => {
	//@ts-ignore
	window.PUPPETER_ON_PROPS(JSON.stringify(props)); // eslint-disable-line
};
mystore2.onprops = props => {
	//@ts-ignore
	window.PUPPETER_ON_PROPS(JSON.stringify(props)); // eslint-disable-line
};

// Initial state
mystore1.state = {
	count: 123
};
mystore2.state = {
	messages: [
		'Initial message 1',
		'Initial message 2'
	]
};

// Send actions
mystore1.schedule(add(1));
mystore2.schedule(log('Hello'));
mystore1.schedule(add(10));
mystore2.schedule(log('World'));
