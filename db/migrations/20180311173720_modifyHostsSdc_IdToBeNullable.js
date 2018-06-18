
exports.up = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('hosts', t => {
                t.uuid('sdc_id')
                    .nullable()
                    .alter();
            });

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('hosts', t => {
                t.uuid('sdc_id')
                    .alter();
            });

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
