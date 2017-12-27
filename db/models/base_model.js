const Model = require('objection').Model;
const guid = require('objection-guid')();

class BaseModel extends guid(Model) {
    $beforeInsert(context) {
        return super.$beforeInsert(context).then(() => {
            this.createdAt = new Date();
            this.updatedAt = new Date();
        });
    }

    $beforeUpdate(context) {
        return super.$beforeInsert(context).then(() => {
            this.updatedAt = new Date();
        });
    }
}

module.exports = BaseModel;
