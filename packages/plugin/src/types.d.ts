declare module 'really-relaxed-json' {
  export default {} as {
    /**
     * Convert RJSON to strict JSON.
     */
    toJson: (rjson: string) => string;
  };
}
