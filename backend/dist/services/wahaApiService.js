"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.getSessionStatus = getSessionStatus;
exports.checkContactExists = checkContactExists;
exports.uploadMedia = uploadMedia;
// Serviço para comunicação com a API WAHA
const settingsService_1 = require("./settingsService");
// Função para normalizar números brasileiros
function normalizeBrazilianPhone(phone) {
    // Remove qualquer caractere não numérico e o + inicial
    let cleanPhone = phone.replace(/\D/g, '');
    // Retorna o número como está - vamos parar de modificar números
    console.log(`📱 Número brasileiro: ${phone} -> ${cleanPhone}`);
    return cleanPhone;
}
async function sendMessage(sessionName, phone, message, validatedChatId) {
    try {
        // Obter configurações WAHA
        const wahaConfig = await settingsService_1.settingsService.getWahaConfig();
        // Usar chatId validado ou normalizar número brasileiro
        const chatId = validatedChatId || `${normalizeBrazilianPhone(phone)}@c.us`;
        let endpoint = '';
        let requestBody = {
            chatId: chatId,
            session: sessionName
        };
        if (message.text) {
            endpoint = '/api/sendText';
            requestBody = {
                chatId: chatId,
                reply_to: null,
                text: message.text,
                linkPreview: true,
                linkPreviewHighQuality: false,
                session: sessionName
            };
        }
        else if (message.image) {
            endpoint = '/api/sendImage';
            requestBody = {
                chatId: chatId,
                file: {
                    mimetype: 'image/jpeg',
                    filename: 'image.jpg',
                    url: message.image.url
                },
                reply_to: null,
                caption: message.caption || '',
                session: sessionName
            };
        }
        else if (message.video) {
            endpoint = '/api/sendVideo';
            requestBody = {
                chatId: chatId,
                file: {
                    mimetype: 'video/mp4',
                    filename: 'video.mp4',
                    url: message.video.url
                },
                reply_to: null,
                caption: message.caption || '',
                session: sessionName
            };
        }
        else if (message.audio) {
            endpoint = '/api/sendVoice';
            requestBody = {
                chatId: chatId,
                file: {
                    mimetype: 'audio/ogg; codecs=opus',
                    url: message.audio.url
                },
                reply_to: null,
                convert: true,
                session: sessionName
            };
        }
        else if (message.document) {
            endpoint = '/api/sendFile';
            requestBody = {
                chatId: chatId,
                file: {
                    mimetype: 'application/pdf',
                    filename: message.fileName || 'document.pdf',
                    url: message.document.url
                },
                reply_to: null,
                session: sessionName
            };
        }
        else {
            throw new Error('Unsupported message type');
        }
        console.log(`WAHA API - Sending to: ${wahaConfig.host}${endpoint}`);
        console.log(`WAHA API - Request body:`, JSON.stringify(requestBody, null, 2));
        const response = await fetch(`${wahaConfig.host}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': wahaConfig.apiKey
            },
            body: JSON.stringify(requestBody)
        });
        console.log(`WAHA API - Response status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            const responseText = await response.text();
            console.log(`WAHA API - Error response:`, responseText);
            throw new Error(`WAHA API error: ${response.status} ${response.statusText} - ${responseText}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error('Error sending message via WAHA:', error);
        throw error;
    }
}
async function getSessionStatus(sessionName) {
    try {
        const wahaConfig = await settingsService_1.settingsService.getWahaConfig();
        const response = await fetch(`${wahaConfig.host}/api/sessions`, {
            headers: {
                'X-Api-Key': wahaConfig.apiKey
            }
        });
        if (!response.ok) {
            throw new Error(`WAHA API error: ${response.status} ${response.statusText}`);
        }
        const sessions = await response.json();
        const session = sessions.find((s) => s.name === sessionName);
        if (!session) {
            throw new Error(`Session ${sessionName} not found`);
        }
        return session;
    }
    catch (error) {
        console.error('Error getting session status from WAHA:', error);
        throw error;
    }
}
async function checkContactExists(sessionName, phone) {
    try {
        const wahaConfig = await settingsService_1.settingsService.getWahaConfig();
        const normalizedPhone = normalizeBrazilianPhone(phone);
        console.log(`🔍 Checking if contact exists: ${phone} -> ${normalizedPhone}`);
        // Usar o endpoint correto de checagem
        const response = await fetch(`${wahaConfig.host}/api/contacts/check-exists?phone=${normalizedPhone}&session=${sessionName}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-Api-Key': wahaConfig.apiKey
            }
        });
        if (!response.ok) {
            console.log(`❌ Error checking contact ${normalizedPhone}: ${response.status} ${response.statusText}`);
            return { exists: false };
        }
        const result = await response.json();
        const exists = result.numberExists === true;
        console.log(`${exists ? '✅' : '❌'} Contact ${normalizedPhone} exists: ${exists}`);
        if (exists && result.chatId) {
            console.log(`📱 Using API returned chatId: ${result.chatId}`);
            return { exists: true, chatId: result.chatId };
        }
        return { exists: false };
    }
    catch (error) {
        console.error(`❌ Error checking contact existence for ${phone}:`, error);
        return { exists: false };
    }
}
async function uploadMedia(sessionName, file, fileName) {
    try {
        const wahaConfig = await settingsService_1.settingsService.getWahaConfig();
        const formData = new FormData();
        formData.append('file', new Blob([file]), fileName);
        const response = await fetch(`${wahaConfig.host}/api/${sessionName}/files`, {
            method: 'POST',
            headers: {
                'X-Api-Key': wahaConfig.apiKey
            },
            body: formData
        });
        if (!response.ok) {
            throw new Error(`WAHA API error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error('Error uploading media to WAHA:', error);
        throw error;
    }
}
//# sourceMappingURL=wahaApiService.js.map