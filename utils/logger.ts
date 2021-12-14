import * as logger from "https://deno.land/std@0.117.0/log/mod.ts";

const level = 'DEBUG';
await logger.setup({
    handlers: {
        console: new logger.handlers.ConsoleHandler("DEBUG"),

        format: new logger.handlers.ConsoleHandler("DEBUG", {
            formatter: "[{loggerName}] - {levelName} {msg}",
        }),
    },

    loggers: {
        default: {
            level,
            handlers: ["console"],
        },

        WebSocket: {
            level,
            handlers: ["format"],
        },
    }
});

export default logger;