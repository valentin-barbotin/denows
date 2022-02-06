/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { IUser } from './User.ts';

interface _IMessageID {
    id: string;
}
interface MessageData {
    [k: string]: any,
}

interface IMessageSync extends _IMessageID {
    position: [number, number, number],
    rotation: number[],
}

interface IMessageNewUserJoined  {
    user: IUser,
    password: string,
}

interface Message {
    type: string;
    data: IMessageNewUserJoined | IMessageSync | MessageData;
    password?: string;
}

export type {
  Message, MessageData, IMessageNewUserJoined, IMessageSync,
};
