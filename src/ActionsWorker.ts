/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

interface IFrozen {
	readonly [key: string]: any;
}

interface IMessage {
	action: string | number;
}

export interface IDispatcher<State, Message> {
	state: State;
	schedule(message: Message): void;
}

/**
 * An Action can perform a single change on the state, and schedule additional actions.
 */
type Action<State extends IFrozen, Message extends IMessage> = (
	data: Message,
	dispatcher: IDispatcher<State, Message>
) => void;


/**
 * Set of Action instances.
 */
type Actions<State extends IFrozen, Message extends IMessage> = {
	[key: string]: Action<State, Message>;
};


/**
 * Callback when props change.
 */
type OnProps<Props> = (props: Props) => void;


/**
 *
 */
export class ActionsWorker <Props extends IFrozen, State extends IFrozen, Message extends IMessage> {

	protected readonly actions: Actions<State, Message> = {};

	/**
	 * Callback triggered when `props` change;
	 */
	public onprops?: OnProps<Props>;


	/**
	 * Generates render Props from an immutable State.
	 */
	protected serialize(_state: State): Props {
		throw new Error('Failed to serialize');
	}

	/**
	 * Frozen JSON-compatible props for rendering.
	 */
	private _props: Props;
	public get props(): Props {
		return this._props;
	}
	public set props(newProps: Props) {
		const hasChanged = JSON.stringify(newProps) !== JSON.stringify(this.props); // @quickhack Not the cleanest "deep strict equal"
		if (hasChanged){
			this._props = newProps;
			if (this.onprops){
				this.onprops(newProps);
			}
		}
	}

	/**
	 * Immutable application state.
	 */
	private _state: State;
	public get state(): State {
		return this._state;
	}
	public set state(newState: State) {
		const props = this.serialize(newState);
		this._state = newState;
		this.props = props;
	}

	/**
	 * Forwards a message to the Worker messages queue.
	 */
	public schedule(data: Message): void {
		this.onmessage({data});
	}

	/**
	 * Receives messages from the main thread or from within the Worker.
	 */
	public onmessage(event: {data: Message | null | undefined}): void {
		const {data} = event;
		if (data && (data !== null)){
			const actionId: string = String(data.action);
			if (actionId in this.actions){
				const action: Action<State, Message> = this.actions[actionId];
				action(data, this);
			} else {
				throw new Error('Unknown action');
			}
		} else {
			throw new Error('Message is not an action');
		}
	}
}
