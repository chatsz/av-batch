"use strict";
class BatchRecord {
    /**
     * The Batch record constructor.
     * @param id The Id of the object.
     * @param object The payload.
     */
    constructor(id, object) {
        this.id = id;
        this.object = object;
    }
    /**
     * Get Id.
     */
    get getId() {
        return this.id;
    }
    /**
     * Get the payload.
     */
    get getObject() {
        return this.object;
    }
}

module.exports = BatchRecord;