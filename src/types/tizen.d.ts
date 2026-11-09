// Samsung Tizen TV API declarations

export interface TizenTvInputDevice {
  registerKey(keyName: string): void;
  unregisterKey(keyName: string): void;
  getSupportedKeys(): Array<{ name: string; code: number }>;
  getKey(keyName: string): { name: string; code: number };
}

export interface TizenApplication {
  exit(): void;
  hide(): void;
}

export interface TizenApplicationService {
  getCurrentApplication(): TizenApplication;
}

export interface TizenSystemInfo {
  getCapability(capability: string): any;
}

export interface TizenWindow {
  tizen?: {
    tvinputdevice?: TizenTvInputDevice;
    application?: TizenApplicationService;
    systeminfo?: TizenSystemInfo;
  };
  webapis?: {
    productinfo?: {
      getModel(): string;
      getFirmware(): string;
      isUdPanelSupported(): boolean;
    };
  };
}

declare global {
  interface Window extends TizenWindow {}
}
