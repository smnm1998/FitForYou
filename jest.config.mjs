import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    dir: "./",
});

const config = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testEnvironment: "jest-environment-jsdom",
    preset: "ts-jest",
};

export default createJestConfig(config);
