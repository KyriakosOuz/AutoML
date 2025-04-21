
export type HyperParameter = string | number | boolean | number[];

export interface HyperParameters {
  [key: string]: HyperParameter;
}
