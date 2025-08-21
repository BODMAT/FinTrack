import type { IData, IUser } from "../types/custom";

const titlesIncome = ["Salary", "Investment", "Bonus", "Gift", "Transport"];
const titlesOutcome = ["Coffee", "Shopping", "Rent", "Utilities", "Groceries"];

function randomSum(min: number, max: number): number {
    return +(Math.random() * (max - min) + min).toFixed(2);
}

export const getUserByNickAndPass = async (nickname: string, password: string): Promise<IUser> => {
    try {
        console.log("Login:", nickname, password);
        return await new Promise<IUser>((resolve) => {
            setTimeout(() => {
                const data: IData[] = [];
                const startDate = new Date(2023, 0, 1).getTime();
                const endDate = Date.now();
                const totalItems = 200;

                for (let i = 0; i < totalItems; i++) {
                    const timestamp = startDate + ((endDate - startDate) / totalItems) * i;
                    const date = new Date(timestamp);
                    const id = i + 1;
                    const isIncome = Math.random() < 0.5;

                    const titleList = isIncome ? titlesIncome : titlesOutcome;
                    const title = titleList[Math.floor(Math.random() * titleList.length)];

                    const sum = randomSum(10, 5000);

                    const location = {
                        lat: Math.random() * (52.4 - 44.4) + 44.4,
                        lng: Math.random() * (40.2 - 22.1) + 22.1,
                    };

                    data.push({
                        id,
                        title,
                        amount: sum,
                        isIncome,
                        date: date.toISOString(),
                        location: location,
                    });
                }

                resolve({
                    nickname: nickname.toLowerCase(),
                    password,
                    userName: "Anonimus User",
                    userPhoto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    data,
                });
            }, 1);
        });
    } catch (error) {
        console.error("Error in getDataByUserId:", error);
        return {} as IUser;
    }
};

