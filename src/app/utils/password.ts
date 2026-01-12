import { randomBytes, scryptSync } from "crypto";

/**
 * Cria o hash de uma senha usando salt aleatório.
 * @return {string} Hash + salt (96 caracteres: 64 do hash + 32 do salt)
 */
export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString("hex");
    const hashed = scryptSync(password, salt, 32).toString("hex");
    return hashed + salt;
};

/**
 * Compara uma senha com um hash salvo.
 */
export const matchPassword = (password: string, hash: string): boolean => {
    const salt = hash.slice(64);
    const originalHash = hash.slice(0, 64);
    const testHash = scryptSync(password, salt, 32).toString("hex");
    return testHash === originalHash;
};