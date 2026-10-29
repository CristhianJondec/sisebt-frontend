-- Vacia sisebt_e2e_db antes de sembrarla (lo ejecuta playwright.config.ts).
-- El resto de tablas cuelga de estas tres y se borra en cascada.
TRUNCATE users, surveys, events CASCADE;
