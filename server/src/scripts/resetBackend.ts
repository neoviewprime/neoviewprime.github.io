import { runMigrations } from "../db/migrate";
import { logger } from "../utils/logger";
import { superadminService } from "../services/superadminService";

const resetBackend = async () => {
  await runMigrations();
  const result = await superadminService.resetBackendDataOnly();

  logger.info("Backend reset completed", {
    ...result
  });
};

resetBackend()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Backend reset failed", { error: (error as Error).message });
    process.exit(1);
  });
