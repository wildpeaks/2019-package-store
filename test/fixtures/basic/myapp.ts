import {Store} from '../../..';
import {action as actionLog} from 'actions/log';
import {action as actionAdd} from 'actions/add';
import {Id as LogMessageId, Message as LogMessage, format as log} from 'messages/log';
import {Id as AddMessageId, Message as AddMessage, format as add} from 'messages/add';

type Props = Readonly<{
	text1: string;
	text2: string;
}>;

type State = Readonly<{
	count: number;
	messages: string[];
}>;

// Register actions
type Messages = LogMessage | AddMessage;
const mystore = new Store<State, Props, Messages>();
mystore.register(LogMessageId, actionLog);
mystore.register(AddMessageId, actionAdd);

// State to Props
mystore.serialize = state => {
	const props: Props = {
		text1: `Count: ${state.count}`,
		text2: `Lines: ${state.messages.join(',')}`
	};
	Object.freeze(props);
	return props;
};

// Subscribe to props
mystore.onprops = props => {
	const text = JSON.stringify(props);
	//@ts-ignore
	window.PUPPETER_ON_PROPS(text); // eslint-disable-line
};

// Initial state
mystore.state = {
	count: 2000,
	messages: [
		'Initial message 1',
		'Initial message 2'
	]
};

// Send actions using formatter
mystore.schedule(add(1));
mystore.schedule(add(10));
mystore.schedule(log('Hello Formatted'));

// Send actions using JSON directly
mystore.schedule({
	action: 'log',
	text: 'Hello JSON'
});
