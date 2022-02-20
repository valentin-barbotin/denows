//DO NOT USE
console.log("Connecting to server ...");

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

let ws:WebSocket;
try {
    ws=new WebSocket('ws://localhost:5000');
} catch(err) {
    console.log('Failed to connect to server ... exiting');
    Deno.exit(1);
}
ws.onopen = connected;
ws.onmessage = (m) => processMessage(ws, m);
ws.onclose = disconnected;
function connected() {
    console.log('Connected to server ...');
}
function disconnected() {
    console.log('Disconnected from server ...');
}
async function processMessage(ws:WebSocket, m:MessageEvent) {
    const message: Blob = m.data;
    console.log(message)
    const data = await message.arrayBuffer()
    const _message: Message = BufferToObject(data);
    console.log(_message.data);

    const response: Message = {
        type: "welcome",
        data: "welcome ok",
    };
    const payload = objectToBuffer(response);
    ws.send(payload);
}