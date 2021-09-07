export declare class Network {
    static masks(cidr: string): {
        [key: string]: string;
    };
    static network(): string[];
    static subnets(): {
        [key: string]: string;
    }[];
}
