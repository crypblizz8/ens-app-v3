import { BigNumber } from 'ethers';
import { ENSArgs } from '..';
declare const _default: {
    raw: ({ contracts }: ENSArgs<"contracts">, name: string) => Promise<{
        to: string;
        data: string;
    }>;
    decode: ({ contracts }: ENSArgs<"contracts">, data: string) => Promise<{
        fuseObj: {
            [k: string]: boolean;
        };
        expiryDate: Date;
        rawFuses: BigNumber;
        owner: any;
    } | undefined>;
};
export default _default;
