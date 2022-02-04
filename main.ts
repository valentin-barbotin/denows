import { serve } from "https://deno.land/std@0.117.0/http/server.ts";
import logger from './utils/logger.ts';
import { Message, IMessageNewUserJoined, IMessageSync } from './interfaces/Message.ts';
import { IUser } from './interfaces/User.ts';
const log = logger.getLogger("WebSocket");

const clients = new Map<string, WebSocket>();


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
    return Array.from(clients.entries()).filter(([key, client]) => key !== playerUUID);
}

const syncWithAll = async (message: Message, playerUUID: string) => {

    message.id = playerUUID;
    log.critical(message);
    const payload = objectToBuffer(message);
    getAllClients(playerUUID).forEach(([key, client]) => {
        log.debug(`Send ${message.type} to ${key} from ${playerUUID}`);
        client.send(payload);
    });
}

const handler = (request: Request) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const uuid = crypto.randomUUID();
    log.info(`Generate new uuid for new client: ${uuid}`);
    clients.set(uuid, socket);
    socket.onopen = () => {
        log.debug(`New client ${uuid}, ${clients.size} client(s) connected`);
    };
    socket.onmessage = (e) => {
        const message: Message = BufferToObject(e.data);
        // log.debug(message.data);

        let payload: Message = {
            type: message.type,
            data: {},
        };
        switch (message.type) {
            case "userSyncPos":
                payload = {
                    type: "userSyncPos",
                    data: message.data,
                };
                syncWithAll(payload, uuid);
                break;
            case "login":
                log.warning(message.data)
                const { user, password } = message.data as IMessageNewUserJoined;
                payload = {
                    type: "userJoined",
                    data: user, //`${clients.size} clients connected`
                };
                syncWithAll(payload, uuid);
                
                getAllClients(uuid).forEach(([key, WebSocket]) => {
                    const newUser: IUser = {
                        name: "dummy",
                    }    
                    payload = {
                        id: key,
                        type: "userJoined",
                        data: newUser,
                    }   
                    const _payload = objectToBuffer(payload);
                    console.log(uuid);
                    socket.send(_payload);
                })
                break;
        
            default:
                return
        }
    };
    socket.onclose = () => {
        const payload: Message = {
            id: uuid,
            type: 'userQuit',
            data: {},
        };
        clients.delete(uuid);
        syncWithAll(payload, uuid);
        log.warning(`WebSocket has been closed by ${uuid}.`)
    };
    socket.onerror = (e: any) => console.error("WebSocket error:", e);
    return response;
};

log.info("Starting server ...");
log.info(`HTTP webserver running. Access it at: http://localhost:5000/`);
await serve(
    handler,
    { addr: "0.0.0.0:5000" }
);