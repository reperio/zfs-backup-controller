const {knex, Model} = require('./connect');

const models = require('./models');
const repositories = require('./repositories');

class UnitOfWork {
    constructor(logger) {
        this._knex = knex;
        this._Model = Model;
        this._models = models;
        this._transaction = null;

        this._logger = logger;

        this._cachedRepositories = {};

        for (const [repositoryName, repository] of Object.entries(repositories)) {
            Object.defineProperty(this, repositoryName, {
                get: () => {
                    return this._cachedRepositories[repositoryName] = this._cachedRepositories[repositoryName] || new repository(this);
                }
            });
        }
    }

    async beginTransaction() {
        if (this._transaction != null) {
            throw new Error("A transaction already exists for this unit of work");
        }
        await new Promise(resolve => {
            knex.transaction(trx => {
                this._transaction = trx;
            });
        });
    }

    async commitTransaction() {
        if (this._transaction == null) {
            throw new Error("A transaction does not exist for this unit of work");
        }
        await this._transaction.commit();
        this.transaction = null;
    }

    async rollbackTransaction() {
        if (this._transaction == null) {
            throw new Error("A transaction does not exist for this unit of work");
        }
        await this._transaction.rollback();
        this._transaction = null;
    }

    get inTransaction() {
        return this._transaction != null;
    }
}

module.exports = UnitOfWork;