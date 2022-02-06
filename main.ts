// deno-lint-ignore-file no-case-declarations
import { serve } from "https://deno.land/std@0.117.0/http/server.ts";
import logger from './utils/logger.ts';
import { Message, IMessageNewUserJoined, IMessageSync } from './interfaces/Message.ts';
import { IUser } from './interfaces/User.ts';
import User from './user.ts';

const log = logger.getLogger("WebSocket");

const clients = new Map<string, [WebSocket, User]>();

const objectToBuffer = (obj: Message): ArrayBuffer => {
    const encoder = new TextEncoder();
    return encoder.encode(JSON.stringify(obj)).buffer;
}

const BufferToObject = (obj: ArrayBuffer) => {
    const encoder = new TextDecoder();
    const payload = encoder.decode(obj);
    log.debug(payload);
    const message: Message = JSON.parse(payload);
    return message;
}

const getAllClients = (playerUUID: string) => {
    return Array.from(clients.entries()).filter(([key, [client, user]]) => key !== playerUUID);
}

const syncWithAll = (message: Message, playerUUID: string) => {
    log.critical(message);
    const payload = objectToBuffer(message);
    getAllClients(playerUUID).forEach(([key, [client, user]]) => {
        log.debug(`Send ${message.type} to ${key} from ${playerUUID}`);
        client.send(payload);
    });
}

const handler = (request: Request) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const uuid = crypto.randomUUID();
    log.info(`Generate new uuid for new client: ${uuid}`);
    socket.onopen = () => {
        log.debug(`New client ${uuid}, ${clients.size} client(s) connected`);
    };
    socket.onmessage = (e) => {
        const message: Message = BufferToObject(e.data);

        const payload: Message = {
            type: message.type,
            data: {},
        };
        switch (message.type) {
            case "userSyncPos":
                payload.data  = message.data as IMessageSync;
                payload.data.id = uuid;
                syncWithAll(payload, uuid);
                break;
            case "login":
                log.warning(message.data)
                const { user, password } = message.data as IMessageNewUserJoined;
                const userObj = new User(uuid, user.name.trim()); 
                const payloadToSync = {
                    type: "userJoined",
                    data: [userObj], //`${clients.size} clients connected`
                };

                syncWithAll(payloadToSync, uuid);
                clients.set(uuid, [socket, userObj]);

                const allUsers: User[] = getAllClients(uuid).map(([key, [WebSocket, user]]) => user);
                
                if (allUsers.length === 0) return;

                const __payload = {
                    type: "userJoined",
                    data: allUsers,
                }

                log.debug(__payload)
                const _payload = objectToBuffer(__payload);
                socket.send(_payload);
                break;
        
            default:
                return
        }
    };
    socket.onclose = () => {
        const currentUser = clients.get(uuid);
        if (!currentUser) {
            log.error(`${uuid} not found in clients`);
            return;
        }
        const payload: Message = {
            type: 'userQuit',
            data: currentUser[1],
        };
        clients.delete(uuid);
        syncWithAll(payload, uuid);
        log.warning(`WebSocket has been closed by ${uuid}.`)
    };
    socket.onerror = (e: any) => console.error("WebSocket error:", e);
    return response;
};

log.info("Starting server ...");
log.info(`HTTP webserver running. Access it at: http://0.0.0.0:5000/`);
await serve(
    handler,
    { addr: "0.0.0.0:5000" }
);