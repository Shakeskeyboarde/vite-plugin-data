export const MOCK_RESULT_PARAM = {
  dependencies: ["/root/dummy-dependency-1.ts", "/root/dummy-dependency-2.ts"],
  exports: {
    joker: "batman",
    marvel: ["ironman", "spiderman", "hulk", "doctor strange"],
    dc: {
      shazam: {
        members: [
          "Pedro Peña",
          "Darla Dudley",
          "Freddy Freeman",
          "Billy Batson",
          "Eugene Choi",
          "Mary Bromfield",
        ],
      },
    },
  },
  dependencyPatterns: [
    "/root/data.txt",
    "/root/folder/*.json",
    "/root/**/*.txt",
  ],
};
