const Model = require('objection').Model;
const uuid = require('uuid');

class BaseModel extends Model {
    $beforeInsert(context) {
        const parent = super.$beforeInsert(context);

        return Promise.resolve(parent)
            .then(() => {
                this.createdAt = new Date();
                this.updatedAt = new Date();

                if (this.auto_generated_id) {
                    this[this.auto_generated_id()] = uuid.v4();
                }
            });
    }

    $beforeUpdate(context) {
        const parent = super.$beforeUpdate(context);

        return Promise.resolve(parent)
            .then(() => {
                this.updatedAt = new Date();
            });
    }
}

module.exports = BaseModel;
