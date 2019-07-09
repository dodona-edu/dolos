import { WinnowFilter } from "./winnowFilter";
import * as fs from 'fs';

export class ReadFile {
    private readonly winnow: WinnowFilter;


    /**
     * Compares 2 files for similarity. intakes a winnowing function, and the 
     * names of the two files. Outputs an array of similar indices.
     * 
     * @param winnow Chooses the winnow function that we wish to use
     */
    constructor(winnow: WinnowFilter) {
        this.winnow = winnow;
    }

    /**
     * Reads file and creates fingerprint for our document. Outputs array of
     * similar portions of arrary.
     * 
     * @param fileSource The file that we would not mind having as a persisting
     * copy in our database
     * @param fileComp The file we wish to compare against. We will not be 
     * storing this on the disk
     */
    public async compareFiles(fileSource: string, fileComp: string) {

        const hashSource: Map<number, number> = new Map();
        const hashComp: Map<number, number> = new Map();

        for await (const [hash, posSource] of this.winnow.hashes(fs.createReadStream(fileSource))) {
            hashSource.set(hash, posSource);
        }
        for await (const [hash, posComp] of this.winnow.hashes(fs.createReadStream(fileComp))) {
            hashComp.set(hash, posComp);
        }

        return this.compareMaps(hashSource, hashComp);
    }

    /**
     * Compares two files. Takes in the fingerprints of the two files, and compares them 
     * against each other. Outputs the similar parts of the two hashmaps.
     * 
     * @param mapSource The hashmap that we use as the source/master copy.
     * @param mapComp The hashmap that we check our source hashmap against.
     */
    public compareMaps(hashSource: Map<number, number>, hashComp: Map<number, number>) {
        const similarElementCollection = [];
        for (let [sourceKey, sourceVal] of hashSource) {
            for (let [compKey, compVal] of hashComp) {
                if (sourceVal === compVal) {
                    var similarText = { sourceKey, sourceVal, compKey, compVal };
                    similarElementCollection.push(similarText);
                }
            }
        }
        return similarElementCollection;
    }
    
    /**
     * Stores the source's fingerprint onto local disk
     */
    public storeFingerprint() {
        // stub
        return;
    }
}