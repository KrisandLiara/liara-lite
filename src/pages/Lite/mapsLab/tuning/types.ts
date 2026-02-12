import type { MapsLabSettings } from "@/pages/Lite/mapsLab/settings";

export type TuningSliderProps = {
  trackClassName?: string;
  thumbClassName?: string;
};

export type TuningCommonProps = {
  draft: MapsLabSettings;
  inputClassName: string;
  sliderProps?: TuningSliderProps;
  updateDraft: <K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => void;
  commitSetting: <K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => void;
  commitFromDraft: <K extends keyof MapsLabSettings>(key: K) => void;
};

