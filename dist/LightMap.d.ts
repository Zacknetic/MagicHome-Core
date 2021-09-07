import { ILightParameters } from './types';
declare const lightTypesMap: Map<number, ILightParameters>;
declare function getPrettyName(uniqueId: string, controllerLogicType: string | null): string;
export { lightTypesMap, getPrettyName };
