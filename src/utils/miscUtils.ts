import { IFetchStateResponse } from '../types';

/**
 * @param data Buffer
 * @returns IFetchStateResponse
 * @example
 * const data = Buffer.from([0x81, 0x23, 0x23, 0x31, 0x00, 0x00, 0x00, 0x64, 0x64, 0x00, 0x64, 0x00, 0x00, 0x0F]);
 * const fetchStateResponse = bufferToFetchStateResponse(data);
 * console.log(fetchStateResponse);
 * {
 *   deviceState: {
 *   isOn: true,
 *   RGB: { red: 100, green: 100, blue: 0 },
 *   CCT: { warmWhite: 100, coldWhite: 0 }
 *   },
 *   deviceMetaData: {
 *     controllerHardwareVersion: 35,
 *     controllerFirmwareVersion: 0,
 *     rawData: <Buffer 81 23 23 31 00 00 00 64 64 00 64 00 00 0f>
 *   }
 * }
 */
export function bufferToFetchStateResponse(data: Buffer): IFetchStateResponse {
	if (!Buffer.isBuffer(data) || data.length < 14)
		throw new Error('Invalid buffer' + data.toString('hex'));

	const fetchStateResponse: IFetchStateResponse = {
		deviceState: {
			isOn: data.readUInt8(2) === 0x23,
			RGB: {
				red: data.readUInt8(6),
				green: data.readUInt8(7),
				blue: data.readUInt8(8),
			},
			CCT: {
				warmWhite: data.readUInt8(9),
				coldWhite: data.readUInt8(11),
			},
		},

		deviceMetaData: {
			controllerHardwareVersion: data.readUInt8(1),
			controllerFirmwareVersion: data.readUInt8(10),
			rawData: data,
		},
	};

	return fetchStateResponse;
}

/**
 * @param data Buffer
 * @returns Buffer
 * @example
 * const data = Buffer.from([0x81, 0x23, 0x23, 0x31, 0x00, 0x00, 0x00, 0x64, 0x64, 0x00, 0x64, 0x00, 0x00, 0x0F]);
 * const checksum = calcChecksum(data);
 * console.log(checksum);
 * <Buffer 81 23 23 31 00 00 00 64 64 00 64 00 00 0f 0f>
 * */
export function calcChecksum(buffer: Uint8Array): Buffer {
	let checksum = 0;

	for (const byte of buffer) {
		checksum += byte;
	}

	checksum = checksum & 0xff;
	const finalCommand: Buffer = Buffer.concat([buffer, Buffer.from([checksum])]);

	return finalCommand;
}

export function bufferFromByteArray(byteArray: number[], useChecksum = true) {
	const buffer = Buffer.from(byteArray);
	let payload = buffer;

	if (useChecksum) payload = calcChecksum(buffer);

	return payload;
}

export function deepEqual(object1, object2, omitKeysArr?: Array<string>) {
	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);

	const omitSet = new Set(omitKeysArr ?? []);
	if (keys1.length !== keys2.length && omitKeysArr?.length <= 0) {
		return false;
	}
	for (const key of keys1) {
		if (omitSet.has(key)) continue;
		const val1 = object1[key];
		const val2 = object2[key];
		const areObjects = isObject(val1) && isObject(val2);
		if (
			(areObjects && !deepEqual(val1, val2, omitKeysArr)) ||
			(!areObjects && val1 !== val2)
		) {
			return false;
		}
	}
	return true;
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function isObject(item: any): item is Record<string, any> {
	return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Clone one object into a new object. Source object is not mutated.
 * @param object T
 * @returns T
 * @example
 * const source: T = { a: 1 };
 * const cloned = cloneDeep<T>(source);
 * console.log(cloned); // { a: 1 }
 * console.log(source); // { a: 1 }
 * console.log(source === cloned); // false
 * console.log(source.a === cloned.a); // true
 * source.a = 2;
 * console.log(source); // { a: 2 }
 * console.log(cloned); // { a: 1 }
 *  */
export function cloneDeep<T>(object: T): T {
	return mergeDeep({} as T, object);
}

/**
 * Combine multiple partial<T> source objects into a new T object. Source objects are not mutated.
 * @param sources Partial<T>[]
 * @returns newObject<T>
 * @example
 * const source1: Partial<T> = { a: 1 };
 * const source2: Partial<T> = { b: 2 };
 * const combined = combineDeep<T>(source1, source2);
 * console.log(combined); // { a: 1, b: 2 }
 * console.log(source1); // { a: 1 }
 * console.log(source2); // { b: 2 }
 */
export function combineDeep<T>(...sources: Partial<T>[]): T {
	if (!sources.length) return {} as T;
	return mergeDeep({} as T, ...sources);
}

/**
 * Merge multiple partial<T> objects into an existing single T object. Source objects are not mutated, target is.
 * @param target T
 * @param sources Partial<T>[]
 * @returns T
 * @example
 * const target: <T> = { a: 1, b: 2, c: 3 };
 * const source1: Partial<T> = { b: 4 };
 * const source2: Partial<T> = { c: 5 };
 * const returnedTarget = mergeDeep<T>(target, source1, source2);
 * console.log(target); // { a: 1, b: 4, c: 5 }
 * console.log(returnedTarget); // { a: 1, b: 4, c: 5 }
 */
export function mergeDeep<T>(target: T, ...sources: Partial<T>[]): T {
	if (!sources.length) return target;
	const source = sources.shift();

	if (target == null || !isObject(target) || !isObject(source)) return target;

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			if (isObject(source[key])) {
				if (!target[key]) target[key] = {} as any;
				target[key] = mergeDeep(target[key] as any, source[key] as any); // Assign the result back to target[key]
			} else {
				target[key] = source[key] as any;
			}
		}
	}

	return mergeDeep(target, ...sources);
}

export function sleepTimeout(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Mutex {
	private locked = false;
	private queue: ((value: (() => void) | PromiseLike<() => void>) => void)[] =
		[];

	async lock(): Promise<() => void> {
		if (this.locked) {
			return new Promise(
				(
					resolve: (value: (() => void) | PromiseLike<() => void>) => void,
					reject: (reason?: any) => void
				) => {
					this.queue.push(resolve);
				}
			);
		} else {
			this.locked = true;
			return () => {
				this.unlock();
			};
		}
	}

	unlock(): void {
		if (this.queue.length > 0) {
			const resolve = this.queue.shift();
			resolve(() => {
				this.unlock();
			});
		} else {
			this.locked = false;
		}
	}
}

export async function asyncWaitCurveball(timeout) {
	await new Promise(async (resolve, reject) => {
		await setTimeout(() => {
			resolve(true);
		}, 5000);
	});
}
