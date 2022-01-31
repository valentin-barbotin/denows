import { serve } from "https://deno.land/std@0.117.0/http/server.ts";
import logger from './utils/logger.ts';
const log = logger.getLogger("WebSocket");

const clients = new Map<string, WebSocket>();

interface Message {
    type: string;
    data: string;
}

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

const syncWithAll = async (position: string, playerUUID: string) => {
    const newPlayerPosition = {
        player: playerUUID,
        position,
    }
    const message: Message = {
        type: "receivePosition",
        data: JSON.stringify(newPlayerPosition),
    };
    const payload = objectToBuffer(message);
    getAllClients(playerUUID).forEach(([key, client]) => {
        client.send(payload);
    });
}

const handler = (request: Request) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const uuid = crypto.randomUUID();
    log.debug(`Generate new uuid for new client: ${uuid}`);
    clients.set(uuid, socket);
    socket.onopen = () => {
        {
            const response: Message = {
                type: "welcome",
                data: "Welcome to the chat",
            };
            const payload = objectToBuffer(response);
            socket.send(payload);
        }
        {
            const message: Message = {
                type: "newClient",
                data: `New client ${uuid}, ${clients.size} clients connected`,
            }
            const payload = objectToBuffer(message);
            const allClients = getAllClients(uuid);
            allClients.forEach(([key, client]) => {
                client.send(payload);
            });
        }
    };
    socket.onmessage = (e) => {
        const message: Message = BufferToObject(e.data);
        // log.debug(message.data);

        let data: Message = {
            type: "",
            data: "",
        };
        switch (message.type) {
            case "getAll":
                data = {
                    type: "res_getAll",
                    data: `${clients.size} clients connected`,
                };
                break;
            
            case "syncPosition":
                data = {
                    type: "res_syncPosition",
                    data: message.data,
                };
                
                syncWithAll(message.data, uuid);
                break;
        
            default:
                return
        }

        const payload = objectToBuffer(data);
        socket.send(payload);
    };
    socket.onclose = () => {
        clients.delete(uuid);
        log.warning(`WebSocket has been closed by ${uuid}.`)
    };
    socket.onerror = (e: any) => console.error("WebSocket error:", e);
    return response;
};

log.info("Starting server ...");
log.info(`HTTP webserver running. Access it at: http://localhost:5000/`);
await serve(
    handler,
    { addr: ":5000" }
);