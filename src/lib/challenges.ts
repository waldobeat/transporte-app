const challenges: Record<string, string> = {};

export const saveChallenge = (id: string, challenge: string) => {
    challenges[id] = challenge;
};

export const getExpectedChallenge = (id: string) => {
    return challenges[id];
};

export const deleteChallenge = (id: string) => {
    delete challenges[id];
};
