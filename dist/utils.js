"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJson = exports.parseJson = exports.convertHSLtoRGB = exports.hue2rgb = exports.convertRGBtoHSL = exports.checksum = exports.clamp = void 0;
const fs_1 = require("fs");
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
exports.clamp = clamp;
//=================================================
// Start checksum //
//a checksum is needed at the end of the byte array otherwise the message is rejected by the light
//add all bytes and chop off the beginning by & with 0xFF
function checksum(buffer) {
    let chk = 0;
    for (const byte of buffer) {
        chk += byte;
    }
    return chk & 0xff;
}
exports.checksum = checksum;
//=================================================
// Start Convert RGBtoHSL //
function convertRGBtoHSL({ red, green, blue }) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    if (max === min) {
        h = 0;
    }
    else if (r === max) {
        h = (g - b) / delta;
    }
    else if (g === max) {
        h = 2 + (b - r) / delta;
    }
    else if (b === max) {
        h = 4 + (r - g) / delta;
    }
    h = Math.min(h * 60, 360);
    if (h < 0) {
        h += 360;
    }
    const l = (min + max) / 2;
    if (max === min) {
        s = 0;
    }
    else if (l <= 0.5) {
        s = delta / (max + min);
    }
    else {
        s = delta / (2 - max - min);
    }
    const HSL = { hue: h, saturation: s * 100, luminance: l * 100 };
    return HSL;
}
exports.convertRGBtoHSL = convertRGBtoHSL;
function hue2rgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}
exports.hue2rgb = hue2rgb;
//=================================================
// End Convert RGBtoHSL //
//=================================================
// Start Convert HSLtoRGB //
function convertHSLtoRGB({ hue, saturation, luminance }) {
    const h = hue / 360;
    const s = saturation / 100;
    const l = 50 / 100;
    let t2;
    let t3;
    let val;
    if (s === 0) {
        val = l * 255;
        return [val, val, val];
    }
    if (l < 0.5) {
        t2 = l * (1 + s);
    }
    else {
        t2 = l + s - l * s;
    }
    const t1 = 2 * l - t2;
    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
            t3++;
        }
        if (t3 > 1) {
            t3--;
        }
        if (6 * t3 < 1) {
            val = t1 + (t2 - t1) * 6 * t3;
        }
        else if (2 * t3 < 1) {
            val = t2;
        }
        else if (3 * t3 < 2) {
            val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        }
        else {
            val = t1;
        }
        rgb[i] = val * 255;
    }
    return rgb;
}
exports.convertHSLtoRGB = convertHSLtoRGB;
//=================================================
// End Convert HSLtoRGB //
function parseJson(value, replacement) {
    try {
        return JSON.parse(value);
    }
    catch (_error) {
        return replacement;
    }
}
exports.parseJson = parseJson;
function loadJson(file, replacement) {
    if (!(0, fs_1.existsSync)(file)) {
        return replacement;
    }
    return parseJson((0, fs_1.readFileSync)(file).toString(), replacement);
}
exports.loadJson = loadJson;
//Unused
/*
export function delayToSpeed(delay: never) {
  let clamped = clamp(delay, 1, 31);
  clamped -= 1; // bring into interval [0, 30]
  return 100 - (clamped / 30) * 100;
}

export function speedToDelay(speed: never) {
  const clamped = clamp(speed, 0, 100);
  return 30 - (clamped / 100) * 30 + 1;
}
*/
