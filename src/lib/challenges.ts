import prisma from './prisma';

export const saveChallenge = async (id: string, challenge: string) => {
    await prisma.passenger.upsert({
        where: { id },
        update: {
            currentChallenge: challenge,
        },
        create: {
            id,
            name: 'Temp', // Temporary placeholder until finalized
            lastName: 'Temp',
            credentialID: 'temp_' + id,
            credentialPK: 'temp',
            currentChallenge: challenge,
        }
    });
};

export const getExpectedChallenge = async (id: string) => {
    const passenger = await prisma.passenger.findUnique({ where: { id } });
    return passenger?.currentChallenge;
};

export const deleteChallenge = async (id: string) => {
    await prisma.passenger.update({
        where: { id },
        data: { currentChallenge: null }
    });
};
