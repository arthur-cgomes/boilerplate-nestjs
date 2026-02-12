import { AsyncLocalStorage } from 'async_hooks';
import { AuditContextData } from '../interfaces/audit-context-data.interface';

class AuditContextStorage {
  private storage = new AsyncLocalStorage<AuditContextData>();

  run<T>(context: AuditContextData, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): AuditContextData {
    return this.storage.getStore() || {};
  }

  getUserId(): string | undefined {
    return this.get().userId;
  }

  getIpAddress(): string | undefined {
    return this.get().ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.get().userAgent;
  }
}

export const auditContext = new AuditContextStorage();
