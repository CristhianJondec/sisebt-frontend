import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Backend simulado: los tests no necesitan la API ni PostgreSQL corriendo. */
export const server = setupServer(...handlers);
