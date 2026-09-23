export interface LicenseInfo {
  tier: 'COMMUNITY' | 'PRO' | 'ENTERPRISE';
  valid: boolean;
  expiresAt?: string;
  maxRouters: number;
  features: string[];
}

export interface ILicensingService {
  getLicense(): Promise<LicenseInfo>;
  activateLicense(key: string): Promise<boolean>;
}

export interface IFeatureFlagService {
  isEnabled(flag: string): boolean;
  getAllFlags(): Record<string, boolean>;
}

export interface AppUpdateInfo {
  updateAvailable: boolean;
  version?: string;
  releaseDate?: string;
  notes?: string;
}

export interface IUpdateService {
  checkForUpdates(): Promise<AppUpdateInfo>;
  downloadAndInstall(): Promise<void>;
}
