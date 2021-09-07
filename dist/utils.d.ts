export declare function clamp(value: number, min: number, max: number): number;
export declare function checksum(buffer: Uint8Array): number;
export declare function convertRGBtoHSL({ red, green, blue }: {
    red: any;
    green: any;
    blue: any;
}): {
    hue: number;
    saturation: number;
    luminance: number;
};
export declare function hue2rgb(p: number, q: number, t: number): number;
export declare function convertHSLtoRGB({ hue, saturation, luminance }: {
    hue: any;
    saturation: any;
    luminance: any;
}): any[];
export declare function parseJson<T>(value: string, replacement: T): T;
export declare function loadJson<T>(file: string, replacement: T): T;
