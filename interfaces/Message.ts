/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { IUser } from './User.ts';

interface MessageData {
    [k: string]: any,
}

interface IMessageSync {
    position: [number, number, number],
    rotation: number[],
}

interface IMessageNewUserJoined  {
    user: IUser,
    password: string,
}

interface Message {
    id?: string,
    type: string;
    data: IMessageNewUserJoined | IMessageSync | {[k: string]: any};
    password?: string;
}

export type {
  Message, MessageData, IMessageNewUserJoined, IMessageSync,
};
