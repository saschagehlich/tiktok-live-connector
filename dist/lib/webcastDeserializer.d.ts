export = WebcastDeserializer;
declare class WebcastDeserializer extends EventEmitter<[never]> {
    constructor();
    process(msg: any): Promise<void>;
}
import { EventEmitter } from "events";
//# sourceMappingURL=webcastDeserializer.d.ts.map