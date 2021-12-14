import { serve } from "https://deno.land/std@0.117.0/http/server.ts";

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
    console.log(payload);
    const message: Message = JSON.parse(payload);
    return message;
}

const handler = (request: Request) => {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const uuid = crypto.randomUUID();
    clients.set(uuid, socket);
    socket.onopen = () => {
        console.log("New client ...");
        const response: Message = {
            type: "welcome",
            data: "Welcome to the chat",
        };
        const payload = objectToBuffer(response);
        socket.send(payload);
    };
    socket.onmessage = (e) => {
        const message: Message = BufferToObject(e.data);
        console.log(message.data);

        return; // tmp
        
        // sample response from server
        const response: Message = {
            type: "welcome",
            data: "message received",
        };
        const payload = objectToBuffer(response);
        socket.send(payload);
    };
    socket.onclose = () => {
        clients.delete(uuid);
        console.log("WebSocket has been closed.")
    };
    socket.onerror = (e) => console.error("WebSocket error:", e);
    return response;
};

console.log(`HTTP webserver running. Access it at: http://localhost:5000/`);
await serve(
    handler,
    { addr: ":5000" }
);