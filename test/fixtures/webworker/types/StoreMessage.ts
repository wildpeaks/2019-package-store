import {Message as LogMessage} from "../messages/log";
import {Message as AddMessage} from "../messages/add";

export type StoreMessage = LogMessage | AddMessage;
