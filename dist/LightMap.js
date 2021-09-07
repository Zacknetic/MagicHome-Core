"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrettyName = exports.lightTypesMap = void 0;
const types_1 = require("./types");
const lightTypesMap = new Map([
    [
        0x04,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWStrip,
            convenientName: 'RGBW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x06,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWStrip,
            convenientName: 'RGBW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x07,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWWStrip,
            convenientName: 'RGBWW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x09,
        {
            controllerLogicType: types_1.ControllerTypes.CCTStrip,
            convenientName: 'CCT Strip',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: true,
            hasBrightness: true,
        },
    ],
    [
        0x21,
        {
            controllerLogicType: types_1.ControllerTypes.DimmerStrip,
            convenientName: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x25,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWWStrip,
            convenientName: 'RGBWW Simultaneous',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x33,
        {
            controllerLogicType: types_1.ControllerTypes.GRBStrip,
            convenientName: 'GRB Strip',
            simultaneousCCT: true,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x35,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWWBulb,
            convenientName: 'RGBWW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x41,
        {
            controllerLogicType: types_1.ControllerTypes.DimmerStrip,
            convenientName: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x44,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWBulb,
            convenientName: 'RGBW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x52,
        {
            controllerLogicType: types_1.ControllerTypes.RGBWWBulb,
            convenientName: 'RGBWW Non-Simultaneous',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x65,
        {
            controllerLogicType: types_1.ControllerTypes.DimmerStrip,
            convenientName: 'Dimmer',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0x93,
        {
            controllerLogicType: types_1.ControllerTypes.Switch,
            convenientName: 'Power Socket',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: false,
        },
    ],
    [
        0x97,
        {
            controllerLogicType: types_1.ControllerTypes.Switch,
            convenientName: 'Power Socket',
            simultaneousCCT: false,
            hasColor: false,
            hasCCT: false,
            hasBrightness: false,
        },
    ],
    [
        0xa1,
        {
            controllerLogicType: types_1.ControllerTypes.RGBStrip,
            convenientName: 'RGB Strip',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
    [
        0xa2,
        {
            controllerLogicType: types_1.ControllerTypes.RGBStrip,
            convenientName: 'RGB Strip',
            simultaneousCCT: false,
            hasColor: true,
            hasCCT: false,
            hasBrightness: true,
        },
    ],
]);
exports.lightTypesMap = lightTypesMap;
function getPrettyName(uniqueId, controllerLogicType) {
    const uniqueIdTruc = uniqueId.slice(-6);
    let deviceType = 'LED';
    if (controllerLogicType) {
        if (isType(controllerLogicType, 'bulb')) {
            deviceType = 'Bulb';
        }
        else if (isType(controllerLogicType, 'strip')) {
            deviceType = 'Strip';
        }
        else if (isType(controllerLogicType, 'switch')) {
            deviceType = 'Switch';
        }
    }
    return `${deviceType} ${uniqueIdTruc}`;
}
exports.getPrettyName = getPrettyName;
function isType(a, b) {
    return a.toLowerCase().indexOf(b) > -1;
}
