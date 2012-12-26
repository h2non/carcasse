
//@tag foundation,core
//@define Carcasse.Date
//@require Carcasse.Error

/**
 *
 */
Carcasse.Date = {
    /** @ignore */
    now: Date.now,

    /**
     * @private
     * Private for now
     */
    toString: function(date) {
        if (!date) {
            date = new Date();
        }

        var pad = Carcasse.String.leftPad;

        return date.getFullYear() + "-"
            + pad(date.getMonth() + 1, 2, '0') + "-"
            + pad(date.getDate(), 2, '0') + "T"
            + pad(date.getHours(), 2, '0') + ":"
            + pad(date.getMinutes(), 2, '0') + ":"
            + pad(date.getSeconds(), 2, '0');
    }
};