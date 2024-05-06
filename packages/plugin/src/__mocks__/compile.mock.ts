export const MOCK_JSON_SAFE_EXPORTS = {
  day: "Monday",
  month: 5,
  year: 2025,
  date: 12,
  dummyObject: {
    validJsonField: "some-string",
  },
  default: {
    weather: "sunny",
    temperature: "32",
    unit: "celcius",
  },
};

export const MOCK_JSON_UNSAFE_EXPORTS = {
  unsafeFunction: (s: string) => {
    return s + s;
  },
  unsafeClass: class MOCK_CLASS {
    field = 5;
  },
};

export const MOCK_EXPORTS_WITH_PROMISE = {
  bio: Promise.resolve({ name: "Bob", age: 15 }),
  default: Promise.resolve(15),
};
