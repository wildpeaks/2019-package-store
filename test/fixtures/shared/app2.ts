import {Store} from '../../..';
import {action as actionAdd} from 'actions/add';
import {Message as AddMessage} from 'messages/add';

type SecondProps = Readonly<{
	second: string;
}>;

type SecondState = Readonly<{
	count: number;
	hello: Readonly<{
		world: string;
	}>;
}>;


// Register actions
const mystore = new Store<SecondState, SecondProps, AddMessage>();
mystore.register('add', actionAdd);

// State to Props
mystore.serialize = state => {
	const props: SecondProps = {
		second: `Count: ${state.count}, Hello: ${state.hello.world.toLowerCase()}`
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
	hello: {
		world: 'Second App'
	}
};

// Send actions
mystore.schedule({
	action: 'add',
	toAdd: 2
});
mystore.schedule({
	action: 'add',
	toAdd: 20
});
