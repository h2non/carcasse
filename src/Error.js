
//@tag foundation,core
//@define Carcasse.Error
//@require Carcasse.JSON

Carcasse.Error = {
    raise: function(object) {
        throw new Error(object.msg);
    }
};