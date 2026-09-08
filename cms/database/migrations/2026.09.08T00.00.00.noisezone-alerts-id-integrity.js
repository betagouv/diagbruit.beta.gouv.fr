'use strict';

/**
 * Restores id integrity on `noisezone_alerts`.
 *
 * Prod drifted because content was written outside Strapi's write path (raw
 * SQL / data-only restore) with explicit ids starting at 1, colliding with the
 * draft rows the bootstrap seed had already created. The primary key was
 * missing there, so nothing rejected the collisions.
 *
 * Three steps, all idempotent:
 *   1. resync the sequence past max(id), then renumber duplicate rows
 *   2. add the primary key back (prevents collisions)
 *   3. install a BEFORE INSERT trigger (heals collisions from raw inserts)
 *
 * Renumbering `id` is safe for this table: nothing references it (no FKs, no
 * Strapi link/component tables), the draft<->published pair is keyed on
 * `document_id`, the admin panel navigates by `document_id`, and the API
 * resolves alerts by `alert_slug`.
 */

const TABLE = 'noisezone_alerts';

// Migrations run during db.schema.sync(), by which point `global.strapi` is
// set -- but it is flagged for deprecation upstream, so never let a log call
// be the thing that stops the app from booting.
const log = (level, message) => {
  if (typeof strapi !== 'undefined' && strapi.log && strapi.log[level]) {
    strapi.log[level](message);
  } else {
    console.log(`[${level}] ${message}`);
  }
};

async function up(knex) {
  // --- 1. resync sequence, then renumber duplicates ------------------------
  // The sequence must lead max(id) before we draw from it, otherwise nextval
  // hands back values that collide with existing rows.
  await knex.raw(
    `SELECT setval(
       pg_get_serial_sequence(?, 'id'),
       COALESCE((SELECT max(id) FROM ??), 0) + 1,
       false
     )`,
    [TABLE, TABLE],
  );

  // ctid, not id: id is not unique yet, so it cannot identify a row.
  const { rows: renumbered } = await knex.raw(
    `WITH dupes AS (
       SELECT ctid, row_number() OVER (
                PARTITION BY id ORDER BY created_at NULLS LAST, ctid
              ) AS rn
       FROM ??
     )
     UPDATE ?? a
     SET    id = nextval(pg_get_serial_sequence(?, 'id'))
     FROM   dupes d
     WHERE  a.ctid = d.ctid AND d.rn > 1
     RETURNING a.id, a.document_id, a.alert_slug`,
    [TABLE, TABLE, TABLE],
  );

  if (renumbered.length > 0) {
    log(
      'warn',
      `[migration] ${TABLE}: reassigned ${renumbered.length} duplicate id(s): ` +
        renumbered.map((r) => `${r.alert_slug ?? r.document_id}->${r.id}`).join(', '),
    );
  }

  // --- 2. primary key ------------------------------------------------------
  // The trigger heals, the PK prevents: the trigger's EXISTS check is a
  // check-then-insert race, so concurrent inserts still need the PK backstop.
  const { rows: pk } = await knex.raw(
    `SELECT 1 FROM pg_constraint
     WHERE conrelid = ?::regclass AND contype = 'p'`,
    [TABLE],
  );

  if (pk.length === 0) {
    await knex.raw(`ALTER TABLE ?? ADD PRIMARY KEY (id)`, [TABLE]);
    log('info', `[migration] ${TABLE}: primary key restored on (id).`);
  }

  // --- 3. collision-healing trigger ---------------------------------------
  // Strapi never sends an explicit id (it relies on the column default), so
  // the WHILE condition is false and this is a no-op in normal operation. It
  // only engages for raw inserts that carry a literal id.
  await knex.raw(`
    CREATE OR REPLACE FUNCTION noisezone_alerts_reassign_dup_id()
    RETURNS trigger LANGUAGE plpgsql AS $fn$
    BEGIN
      -- a loop rather than one nextval: also recovers when the sequence lags
      WHILE EXISTS (SELECT 1 FROM noisezone_alerts WHERE id = NEW.id) LOOP
        RAISE NOTICE 'noisezone_alerts: id % already taken, reassigning', NEW.id;
        NEW.id := nextval(pg_get_serial_sequence('noisezone_alerts', 'id'));
      END LOOP;
      RETURN NEW;
    END;
    $fn$;
  `);

  await knex.raw(`DROP TRIGGER IF EXISTS noisezone_alerts_dedup_id ON ??`, [TABLE]);
  await knex.raw(`
    CREATE TRIGGER noisezone_alerts_dedup_id
    BEFORE INSERT ON noisezone_alerts
    FOR EACH ROW EXECUTE FUNCTION noisezone_alerts_reassign_dup_id();
  `);
}

async function down(knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS noisezone_alerts_dedup_id ON ??`, [TABLE]);
  await knex.raw(`DROP FUNCTION IF EXISTS noisezone_alerts_reassign_dup_id()`);
  // The primary key and the renumbering are deliberately not reverted:
  // reintroducing duplicate ids is never the desired state.
}

module.exports = { up, down };
