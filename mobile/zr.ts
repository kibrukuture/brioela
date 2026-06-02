import { readFileSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Get current file directory (ESM compatible way)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read your private key file (using relative path)
const keyPath = resolve(__dirname, './z.p8');
const privateKey = readFileSync(keyPath);

// Configure with your own values
const teamId: string = 'Z5HSLBYMXF'; // Found in your Apple Developer account
const clientId: string = 'com.schnl.sid'; // The identifier you registered ( serviceId )
const keyId: string = '54QAJ7B6KT'; // The ID of the key you downloaded

// Define options for JWT signing
const options: jwt.SignOptions = {
  algorithm: 'ES256',
  expiresIn: '180d', // 6 months
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
};

// Create the client secret
const clientSecret: string = jwt.sign({}, privateKey, options);

console.log(clientSecret);

// 1. create app id (key id)
// 2. create service id. as soon as you finish craeting service it, then set up: those links that after singing: routing for supabase
// and add all those permited domains. REMEMBER: WHITEL ADDING THOSE THINGS REMMER TO ADD THE PROPER APP ID OR SERVICE THAT APPLE LETS CHOOSE FORM SEELCT.
// THIS ONE IS TRICKY OTHERWISE SING WONNT. WONT.
// 3. actually created key id ( cerfificate), rememver DONWLAOD THE KEY AND PUT IT HERE.
// REMMVER SELECT TEH CORRECT APP ID OR SERVICE THAT APPLE LETS CHOOSE FORM SEELCT..
