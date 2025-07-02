export async function generateRandomPassword(length = 6) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomPassword = "";
    for (let i = 0; i < length; i++) {
        randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomPassword;
}