import type { IData, IUser } from "../types/custom";

const titlesIncome = ["Salary", "Investment", "Bonus", "Gift", "Transport"];
const titlesOutcome = ["Coffee", "Shopping", "Rent", "Utilities", "Groceries"];

export const getUserByNickAndPass = async (
    nickname: string,
    password: string,
    page?: number,
    perPage?: number
): Promise<IUser> => {
    try {
        return await new Promise<IUser>((resolve) => {
            setTimeout(() => {
                const data: IData[] = [];
                const startDate = new Date(2023, 0, 1).getTime();
                const endDate = Date.now();
                const totalItems = 34;

                for (let i = 0; i < totalItems; i++) {
                    const timestamp = startDate + ((endDate - startDate) / totalItems) * i;
                    const date = new Date(timestamp);
                    const id = i + 1;
                    const isIncome = i % 2 === 0;

                    const titleList = isIncome ? titlesIncome : titlesOutcome;
                    const title = titleList[i % titleList.length];

                    const sum = 100 + (i % 50) * 10;

                    const location = {
                        lat: 44.4 + ((52.4 - 44.4) / totalItems) * i,
                        lng: 22.1 + ((40.2 - 22.1) / totalItems) * i,
                    };

                    data.push({
                        id,
                        title,
                        amount: sum,
                        isIncome,
                        date: date.toISOString(),
                        location,
                    });
                }

                const slicedData = page && perPage
                    ? data.slice((page - 1) * perPage, page * perPage)
                    : data;

                resolve({
                    nickname: nickname.toLowerCase(),
                    password,
                    userName: "Anonimus User",
                    userPhoto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    data: slicedData,
                });
            }, 500);
        });
    } catch (error) {
        console.error("Error in getUserByNickAndPass:", error);
        return {} as IUser;
    }
};
