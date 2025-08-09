import packageJson from '../../package.json';

export const getVersion = (): string => {
  return packageJson.version;
};

export const APP_VERSION = packageJson.version;