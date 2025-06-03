import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

import logger, {
  dbLogger,
  migrationLogger,
} from '../../src/utils/customLogger.ts';

// Database connection
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://foodapp_user:admin@localhost:6000/foodapp_db';

// Available operations
const operations = {
  create: 'Create schema',
  seed: 'Seed data',
  setup: 'Create + Seed',
  reset: 'Drop + Create + Seed',
  clean: 'Remove all tables (keep database)',
  migrate: 'Run migrations',
  'migrate:up': 'Run pending migrations',
  'migrate:down': 'Rollback last migration',
  'migrate:status': 'Show migration status',
  'migrate:create': 'Create new migration file',
  'migrate:debug': 'Debug migration information',
};

// Available entities
const entities = {
  foods: { schema: 'schemas/01_food_table.sql', seed: 'seeds/foodSeed.sql' },
  users: { schema: 'schemas/02_users_table.sql', seed: 'seeds/userSeed.sql' },
  recipes: {
    schema: 'schemas/03_recipes_table.sql',
    seed: 'seeds/recipeSeed.sql',
  },
  all: 'all entities',
};

// Migration configuration
const MIGRATIONS_DIR = 'database/migrations';
const MIGRATIONS_TABLE = 'schema_migrations';

// Timer utility for performance tracking
function createTimer() {
  const startTime = Date.now();
  return {
    elapsed: () => Date.now() - startTime,
    elapsedMs: () => `${Date.now() - startTime}ms`,
    elapsedSeconds: () => `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
  };
}

// Log startup
logger.info('Database CLI started', {
  command: process.argv.slice(2).join(' '),
  dbUrl: DB_URL.replace(/:.*@/, ':***@'), // Hide password
  pid: process.pid,
  nodeVersion: process.version,
});

function runCommand(command): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = createTimer();

    dbLogger.info('Executing database command', {
      command:
        command.length > 100 ? command.substring(0, 100) + '...' : command,
    });

    exec(command, (error, stdout, stderr) => {
      const duration = timer.elapsedMs();

      if (error) {
        dbLogger.error('Database command failed', {
          command:
            command.length > 100 ? command.substring(0, 100) + '...' : command,
          error: error.message,
          stderr,
          duration,
        });
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        dbLogger.warn('Database command warning', {
          command:
            command.length > 100 ? command.substring(0, 100) + '...' : command,
          stderr,
          duration,
        });
        console.warn(`⚠️  Warning: ${stderr}`);
      }

      dbLogger.info('Database command completed', {
        command:
          command.length > 100 ? command.substring(0, 100) + '...' : command,
        outputLength: stdout.length,
        duration,
      });

      console.log(stdout);
      resolve(stdout);
    });
  });
}

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), 'database', filePath);
  const exists = fs.existsSync(fullPath);

  dbLogger.debug('File existence check', {
    filePath: fullPath,
    exists,
  });

  return exists;
}

// Migration functions
async function ensureMigrationsTable() {
  const timer = createTimer();

  migrationLogger.info('Ensuring migrations table exists');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await runCommand(`psql "${DB_URL}" -c "${createTableSQL}"`);

    migrationLogger.info('Migrations table ready', {
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    migrationLogger.error('Failed to ensure migrations table', {
      error: error.message,
      duration: timer.elapsedMs(),
    });
    throw error;
  }
}

function getMigrationFiles() {
  const timer = createTimer();
  const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);

  if (!fs.existsSync(migrationsPath)) {
    migrationLogger.info('Creating migrations directory', {
      path: migrationsPath,
    });
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  const files = fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  migrationLogger.debug('Migration files discovered', {
    path: migrationsPath,
    fileCount: files.length,
    files,
    duration: timer.elapsedMs(),
  });

  return files;
}

async function getAppliedMigrations() {
  const timer = createTimer();

  try {
    await ensureMigrationsTable();

    migrationLogger.debug('Fetching applied migrations from database');

    const result = await runCommand(
      `psql "${DB_URL}" -t -c "SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version;"`
    );

    const appliedMigrations = result
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());

    migrationLogger.info('Applied migrations retrieved', {
      count: appliedMigrations.length,
      migrations: appliedMigrations,
      duration: timer.elapsedMs(),
    });

    return appliedMigrations;
  } catch (error) {
    migrationLogger.error('Error getting applied migrations', {
      error: error.message,
      duration: timer.elapsedMs(),
    });
    return [];
  }
}

async function runMigration(migrationFile, direction = 'up') {
  const timer = createTimer();

  migrationLogger.info('Starting migration execution', {
    file: migrationFile,
    direction,
    timestamp: new Date().toISOString(),
  });

  const filePath = path.join(process.cwd(), MIGRATIONS_DIR, migrationFile);

  if (!fs.existsSync(filePath)) {
    const error = new Error(`Migration file not found: ${migrationFile}`);
    migrationLogger.error('Migration file not found', {
      file: migrationFile,
      path: filePath,
      duration: timer.elapsedMs(),
    });
    throw error;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Split migration file by -- UP and -- DOWN comments
  const parts = content.split(/-- (UP|DOWN)/i);
  let sql;

  if (direction === 'up') {
    const upIndex = parts.findIndex(
      (part) => part.trim().toUpperCase() === 'UP'
    );
    sql = upIndex !== -1 ? parts[upIndex + 1] : content;
  } else {
    const downIndex = parts.findIndex(
      (part) => part.trim().toUpperCase() === 'DOWN'
    );
    if (downIndex === -1) {
      const error = new Error(
        `No DOWN section found in migration ${migrationFile}`
      );
      migrationLogger.error('Missing DOWN section', {
        file: migrationFile,
        duration: timer.elapsedMs(),
      });
      throw error;
    }
    sql = parts[downIndex + 1];
  }

  if (!sql || !sql.trim()) {
    const error = new Error(
      `No ${direction.toUpperCase()} SQL found in migration ${migrationFile}`
    );
    migrationLogger.error('Empty migration section', {
      file: migrationFile,
      direction,
      duration: timer.elapsedMs(),
    });
    throw error;
  }

  // Create a temporary SQL file for execution
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFile = path.join(
    tempDir,
    `migration_${direction}_${Date.now()}.sql`
  );

  try {
    // Write SQL to temp file
    fs.writeFileSync(tempFile, sql.trim());

    migrationLogger.info('Executing migration SQL', {
      file: migrationFile,
      direction,
      tempFile,
      sqlLength: sql.trim().length,
    });

    console.log(`🔄 Executing ${direction.toUpperCase()} migration...`);
    await runCommand(`psql "${DB_URL}" -f "${tempFile}"`);
    console.log(`✅ Migration SQL executed successfully`);

    // Update migrations table
    const version = migrationFile.replace('.sql', '');

    if (direction === 'up') {
      migrationLogger.info('Recording migration as applied', { version });

      await runCommand(
        `psql "${DB_URL}" -c "INSERT INTO ${MIGRATIONS_TABLE} (version) VALUES ('${version}') ON CONFLICT (version) DO NOTHING;"`
      );
      console.log(`✅ Migration ${version} applied and recorded`);

      // Verify it was recorded
      const verifyResult = await runCommand(
        `psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM ${MIGRATIONS_TABLE} WHERE version = '${version}';"`
      );
      const count = verifyResult.trim();

      migrationLogger.info('Migration recording verified', {
        version,
        recordCount: count,
      });
    } else {
      migrationLogger.info('Removing migration record', { version });

      await runCommand(
        `psql "${DB_URL}" -c "DELETE FROM ${MIGRATIONS_TABLE} WHERE version = '${version}';"`
      );
      console.log(
        `✅ Migration ${version} rolled back and removed from tracking`
      );
    }

    migrationLogger.info('Migration completed successfully', {
      file: migrationFile,
      direction,
      version,
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    migrationLogger.error('Migration execution failed', {
      file: migrationFile,
      direction,
      error: error.message,
      stack: error.stack,
      duration: timer.elapsedMs(),
    });
    throw error;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      migrationLogger.debug('Temp file cleaned up', { tempFile });
    }
  }
}

async function migrateUp() {
  const timer = createTimer();

  migrationLogger.info('Starting pending migrations check');
  console.log('🔄 Running pending migrations...');

  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = allMigrations.filter(
    (migration) => !appliedMigrations.includes(migration.replace('.sql', ''))
  );

  migrationLogger.info('Migration analysis completed', {
    totalMigrations: allMigrations.length,
    appliedMigrations: appliedMigrations.length,
    pendingMigrations: pendingMigrations.length,
    pendingFiles: pendingMigrations,
    analysisTime: timer.elapsedMs(),
  });

  if (pendingMigrations.length === 0) {
    console.log('✅ No pending migrations');
    migrationLogger.info('No pending migrations found', {
      totalDuration: timer.elapsedMs(),
    });
    return;
  }

  for (const migration of pendingMigrations) {
    console.log(`⬆️  Applying migration: ${migration}`);
    await runMigration(migration, 'up');
    console.log(`✅ Applied: ${migration}`);
  }

  migrationLogger.info('All pending migrations completed', {
    appliedCount: pendingMigrations.length,
    totalDuration: timer.elapsedMs(),
  });
  console.log(`🎉 Applied ${pendingMigrations.length} migration(s)`);
}

async function migrateDown() {
  const timer = createTimer();

  migrationLogger.info('Starting migration rollback');
  console.log('🔄 Rolling back last migration...');

  const appliedMigrations = await getAppliedMigrations();

  if (appliedMigrations.length === 0) {
    console.log('✅ No migrations to rollback');
    migrationLogger.info('No migrations available for rollback', {
      duration: timer.elapsedMs(),
    });
    return;
  }

  // Get the actual last migration file name
  const allMigrationFiles = getMigrationFiles();
  const lastAppliedVersion = appliedMigrations[appliedMigrations.length - 1];
  const lastMigrationFile = allMigrationFiles.find(
    (file) => file.replace('.sql', '') === lastAppliedVersion
  );

  if (!lastMigrationFile) {
    migrationLogger.error('Migration file not found for rollback', {
      version: lastAppliedVersion,
      availableFiles: allMigrationFiles,
      duration: timer.elapsedMs(),
    });
    console.error(
      `❌ Migration file not found for version: ${lastAppliedVersion}`
    );
    console.log('Available migrations:', allMigrationFiles);
    return;
  }

  migrationLogger.info('Rolling back migration', {
    file: lastMigrationFile,
    version: lastAppliedVersion,
  });

  console.log(`⬇️  Rolling back migration: ${lastMigrationFile}`);
  await runMigration(lastMigrationFile, 'down');
  console.log(`✅ Rolled back: ${lastMigrationFile}`);

  migrationLogger.info('Migration rollback completed', {
    file: lastMigrationFile,
    version: lastAppliedVersion,
    duration: timer.elapsedMs(),
  });
}

async function migrationStatus() {
  const timer = createTimer();

  migrationLogger.info('Checking migration status');
  console.log('📊 Migration Status:');

  const allMigrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();

  if (allMigrations.length === 0) {
    console.log('No migration files found');
    migrationLogger.info('No migration files found', {
      duration: timer.elapsedMs(),
    });
    return;
  }

  const statusData = allMigrations.map((migration) => {
    const version = migration.replace('.sql', '');
    const isApplied = appliedMigrations.includes(version);
    const status = isApplied ? '✅ Applied' : '⏳ Pending';

    console.log(`  ${migration.padEnd(30)} ${status}`);

    return {
      file: migration,
      version,
      applied: isApplied,
      status,
    };
  });

  const pendingCount = allMigrations.length - appliedMigrations.length;
  console.log(
    `\nSummary: ${appliedMigrations.length} applied, ${pendingCount} pending`
  );

  migrationLogger.info('Migration status completed', {
    totalMigrations: allMigrations.length,
    appliedCount: appliedMigrations.length,
    pendingCount,
    statusData,
    duration: timer.elapsedMs(),
  });
}

async function debugMigrations() {
  const timer = createTimer();

  migrationLogger.info('Starting migration debug');
  console.log('🔍 Debug Migration Information:');

  const allFiles = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();

  console.log('\n📁 Migration Files Found:');
  allFiles.forEach((file) => console.log(`  - ${file}`));

  console.log('\n💾 Applied Migrations in Database:');
  appliedMigrations.forEach((version) => console.log(`  - ${version}`));

  console.log('\n🎯 Last Applied Migration:');
  if (appliedMigrations.length > 0) {
    const lastVersion = appliedMigrations[appliedMigrations.length - 1];
    const lastFile = allFiles.find(
      (file) => file.replace('.sql', '') === lastVersion
    );
    console.log(`  Version: ${lastVersion}`);
    console.log(`  File: ${lastFile || 'NOT FOUND'}`);
  } else {
    console.log('  No migrations applied yet');
  }

  // Check for orphaned files/records
  const orphanedFiles = allFiles.filter(
    (file) => !appliedMigrations.includes(file.replace('.sql', ''))
  );
  const orphanedRecords = appliedMigrations.filter(
    (version) => !allFiles.find((file) => file.replace('.sql', '') === version)
  );

  if (orphanedFiles.length > 0) {
    console.log('\n⚠️  Pending Migration Files:');
    orphanedFiles.forEach((file) => console.log(`  - ${file}`));
  }

  if (orphanedRecords.length > 0) {
    console.log('\n🚨 Orphaned Migration Records (files missing):');
    orphanedRecords.forEach((version) => console.log(`  - ${version}`));
  }

  migrationLogger.info('Migration debug completed', {
    totalFiles: allFiles.length,
    appliedMigrations: appliedMigrations.length,
    orphanedFiles: orphanedFiles.length,
    orphanedRecords: orphanedRecords.length,
    duration: timer.elapsedMs(),
  });
}

function createMigrationFile(name) {
  const timer = createTimer();

  if (!name) {
    console.error('❌ Please provide a migration name');
    console.log('Example: npm run db migrate:create add_user_email');
    migrationLogger.error('Migration creation failed: no name provided');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.sql`;
  const filepath = path.join(process.cwd(), MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- UP
BEGIN;

-- Enable error rollback on any failure
\\set ON_ERROR_STOP on

-- Add your migration SQL here


-- Commit all changes atomically
COMMIT;

-- Success message (only shows if transaction succeeded)
SELECT '${name} migration applied successfully!' as status;


-- DOWN
BEGIN;

-- Enable error rollback on any failure
\\set ON_ERROR_STOP on

-- Add your rollback SQL here


-- Commit the rollback
COMMIT;

-- Success message for rollback
SELECT '${name} migration rolled back successfully!' as status;
`;

  // Ensure migrations directory exists
  const migrationsPath = path.join(process.cwd(), MIGRATIONS_DIR);
  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  try {
    fs.writeFileSync(filepath, template);

    console.log(`✅ Created migration file: ${filename}`);
    console.log(`📝 Edit: ${filepath}`);

    migrationLogger.info('Migration file created successfully', {
      name,
      filename,
      filepath,
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    console.error(`❌ Failed to create migration file: ${error.message}`);
    migrationLogger.error('Migration file creation failed', {
      name,
      filename,
      filepath,
      error: error.message,
      duration: timer.elapsedMs(),
    });
  }
}

async function cleanDatabase() {
  const timer = createTimer();

  console.log('🧹 Cleaning database (removing all tables)...');
  dbLogger.info('Starting database clean operation');

  try {
    // Get list of all tables first
    const tablesResult = await runCommand(
      `psql "${DB_URL}" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"`
    );

    const tables = tablesResult
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());

    dbLogger.info('Found tables to clean', {
      tableCount: tables.length,
      tables,
    });

    if (tables.length === 0) {
      console.log('✅ No tables found - database is already clean');
      dbLogger.info('No tables found to clean', {
        duration: timer.elapsedMs(),
      });
      return;
    }

    console.log(`📋 Found ${tables.length} table(s) to remove:`);
    tables.forEach((table) => console.log(`  - ${table}`));

    // Drop all tables with CASCADE to handle foreign key dependencies
    console.log('🗑️  Removing all tables...');

    for (const table of tables) {
      console.log(`  Dropping table: ${table}`);
      await runCommand(
        `psql "${DB_URL}" -c "DROP TABLE IF EXISTS ${table} CASCADE;"`
      );
    }

    // Also clean up any remaining sequences, views, functions
    console.log('🧽 Cleaning up database objects...');

    // Drop all sequences
    const sequencesResult = await runCommand(
      `psql "${DB_URL}" -t -c "SELECT sequencename FROM pg_sequences WHERE schemaname = 'public';"`
    );

    const sequences = sequencesResult
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());

    for (const sequence of sequences) {
      if (sequence) {
        console.log(`  Dropping sequence: ${sequence}`);
        await runCommand(
          `psql "${DB_URL}" -c "DROP SEQUENCE IF EXISTS ${sequence} CASCADE;"`
        );
      }
    }

    // Drop all views
    const viewsResult = await runCommand(
      `psql "${DB_URL}" -t -c "SELECT viewname FROM pg_views WHERE schemaname = 'public';"`
    );

    const views = viewsResult
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim());

    for (const view of views) {
      if (view) {
        console.log(`  Dropping view: ${view}`);
        await runCommand(
          `psql "${DB_URL}" -c "DROP VIEW IF EXISTS ${view} CASCADE;"`
        );
      }
    }

    // Verify database is clean
    const remainingTablesResult = await runCommand(
      `psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"`
    );

    const remainingCount = parseInt(remainingTablesResult.trim());

    if (remainingCount === 0) {
      console.log('✅ Database cleaned successfully - all tables removed');
      dbLogger.info('Database clean completed successfully', {
        removedTables: tables.length,
        removedSequences: sequences.length,
        removedViews: views.length,
        duration: timer.elapsedMs(),
      });
    } else {
      console.log(`⚠️  Warning: ${remainingCount} table(s) still remain`);
      dbLogger.warn('Some tables remain after clean operation', {
        remainingTables: remainingCount,
        duration: timer.elapsedMs(),
      });
    }
  } catch (error) {
    dbLogger.error('Database clean operation failed', {
      error: error.message,
      stack: error.stack,
      duration: timer.elapsedMs(),
    });
    console.error('❌ Clean operation failed:', error.message);
    throw error;
  }
}

async function createSchema(entity) {
  const timer = createTimer();

  if (entity === 'all') {
    console.log('🏗️  Creating all schemas...');
    dbLogger.info('Creating all schemas');

    for (const [name, config] of Object.entries(entities)) {
      if (name !== 'all' && typeof config === 'object' && config.schema) {
        await createSchema(name);
      }
    }

    dbLogger.info('All schemas created', {
      duration: timer.elapsedMs(),
    });
    return;
  }

  const config = entities[entity];
  if (!config || !config.schema) {
    console.error(`❌ Unknown entity: ${entity}`);
    dbLogger.error('Unknown entity for schema creation', { entity });
    return;
  }

  if (!checkFileExists(config.schema)) {
    console.error(`❌ Schema file not found: database/${config.schema}`);
    dbLogger.error('Schema file not found', {
      entity,
      schemaFile: config.schema,
      duration: timer.elapsedMs(),
    });
    return;
  }

  console.log(`🏗️  Creating ${entity} schema...`);
  dbLogger.info('Creating entity schema', {
    entity,
    schemaFile: config.schema,
  });

  try {
    await runCommand(`psql "${DB_URL}" -f database/${config.schema}`);
    console.log(`✅ ${entity} schema created!`);

    dbLogger.info('Entity schema created successfully', {
      entity,
      schemaFile: config.schema,
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    dbLogger.error('Entity schema creation failed', {
      entity,
      schemaFile: config.schema,
      error: error.message,
      duration: timer.elapsedMs(),
    });
    throw error;
  }
}

async function seedData(entity) {
  const timer = createTimer();

  if (entity === 'all') {
    console.log('🌱 Seeding all data...');
    dbLogger.info('Seeding all data');

    for (const [name, config] of Object.entries(entities)) {
      if (name !== 'all' && typeof config === 'object' && config.seed) {
        await seedData(name);
      }
    }

    dbLogger.info('All data seeded', {
      duration: timer.elapsedMs(),
    });
    return;
  }

  const config = entities[entity];
  if (!config || !config.seed) {
    console.error(`❌ Unknown entity or no seed file: ${entity}`);
    dbLogger.error('Unknown entity or missing seed file', { entity });
    return;
  }

  if (!checkFileExists(config.seed)) {
    console.error(`❌ Seed file not found: database/${config.seed}`);
    dbLogger.error('Seed file not found', {
      entity,
      seedFile: config.seed,
      duration: timer.elapsedMs(),
    });
    return;
  }

  console.log(`🌱 Seeding ${entity} data...`);
  dbLogger.info('Seeding entity data', { entity, seedFile: config.seed });

  try {
    await runCommand(`psql "${DB_URL}" -f database/${config.seed}`);
    console.log(`✅ ${entity} data seeded!`);

    dbLogger.info('Entity data seeded successfully', {
      entity,
      seedFile: config.seed,
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    dbLogger.error('Entity data seeding failed', {
      entity,
      seedFile: config.seed,
      error: error.message,
      duration: timer.elapsedMs(),
    });
    throw error;
  }
}

async function setupEntity(entity) {
  const timer = createTimer();

  console.log(`🚀 Setting up ${entity}...`);
  dbLogger.info('Setting up entity', { entity });

  try {
    await createSchema(entity);
    await seedData(entity);

    dbLogger.info('Entity setup completed', {
      entity,
      duration: timer.elapsedMs(),
    });
  } catch (error) {
    dbLogger.error('Entity setup failed', {
      entity,
      error: error.message,
      duration: timer.elapsedMs(),
    });
    throw error;
  }
}

async function resetDatabase() {
  const timer = createTimer();

  console.log('🗑️  Resetting database...');
  dbLogger.info('Starting database reset');

  try {
    await runCommand(
      `psql "${DB_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
    );

    dbLogger.info('Database schema reset completed', {
      duration: timer.elapsedMs(),
    });

    await setupEntity('all');

    dbLogger.info('Database reset and setup completed', {
      totalDuration: timer.elapsedMs(),
    });
  } catch (error) {
    dbLogger.error('Database reset failed', {
      error: error.message,
      duration: timer.elapsedMs(),
    });
    throw error;
  }
}

function showUsage() {
  console.log(`
🗄️  Food App Database CLI

Usage: node scripts/db.js <operation> <entity>

Operations:
${Object.entries(operations)
  .map(([key, desc]) => `  ${key.padEnd(15)} - ${desc}`)
  .join('\n')}

Entities:
${Object.entries(entities)
  .map(
    ([key, desc]) =>
      `  ${key.padEnd(15)} - ${typeof desc === 'string' ? desc : 'Individual entity'}`
  )
  .join('\n')}

Examples:
  # Schema operations
  node scripts/db.js create foods     # Create foods table
  node scripts/db.js seed users       # Seed users data
  node scripts/db.js setup all        # Full setup
  node scripts/db.js reset            # Reset everything
  node scripts/db.js clean            # Remove all tables

  # Migration operations
  node scripts/db.js migrate:create add_user_email    # Create new migration
  node scripts/db.js migrate:status                   # Show migration status
  node scripts/db.js migrate:up                       # Run pending migrations
  node scripts/db.js migrate:down                     # Rollback last migration
  node scripts/db.js migrate:debug                    # Debug migration info

Environment:
  DATABASE_URL: ${DB_URL.replace(/:.*@/, ':***@')}
  LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}
  NODE_ENV: ${process.env.NODE_ENV || 'development'}
  `);
}

async function main() {
  const mainTimer = createTimer();
  const [operation, entity] = process.argv.slice(2);

  if (!operation) {
    showUsage();
    return;
  }

  logger.info('Starting database operation', {
    operation,
    entity,
    args: process.argv.slice(2),
  });

  try {
    switch (operation) {
      case 'create':
        if (!entity) {
          console.error('❌ Please specify an entity to create');
          return;
        }
        await createSchema(entity);
        break;

      case 'seed':
        if (!entity) {
          console.error('❌ Please specify an entity to seed');
          return;
        }
        await seedData(entity);
        break;

      case 'setup': {
        const setupTarget = entity || 'all';
        await setupEntity(setupTarget);
        break;
      }
      case 'reset':
        await resetDatabase();
        break;

      case 'clean':
        await cleanDatabase();
        break;

      // Migration operations
      case 'migrate':
      case 'migrate:up':
        await migrateUp();
        break;

      case 'migrate:down':
        await migrateDown();
        break;

      case 'migrate:status':
        await migrationStatus();
        break;

      case 'migrate:create':
        createMigrationFile(entity);
        break;

      case 'migrate:debug':
        await debugMigrations();
        break;

      default:
        console.error(`❌ Unknown operation: ${operation}`);
        showUsage();
    }

    logger.info('Database operation completed successfully', {
      operation,
      entity,
      totalDuration: mainTimer.elapsedMs(),
    });
  } catch (error) {
    logger.error('Database operation failed', {
      operation,
      entity,
      error: error.message,
      stack: error.stack,
      totalDuration: mainTimer.elapsedMs(),
    });
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

main();
