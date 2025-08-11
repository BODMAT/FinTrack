import type { IData } from "../types/custom";

const titlesIncome = ["Salary", "Investment", "Bonus", "Gift", "Transport"];
const titlesOutcome = ["Coffee", "Shopping", "Rent", "Utilities", "Groceries"];

function randomSum(min: number, max: number): number {
    return +(Math.random() * (max - min) + min).toFixed(2);
}

export const getDataByUserId = async (userId: number): Promise<IData[]> => {
    try {
        console.log(userId);
        return await new Promise<IData[]>((resolve) => {
            setTimeout(() => {
                const data: IData[] = [];
                const startDate = new Date(2023, 0, 1).getTime();
                const endDate = Date.now();
                const totalItems = 500;

                for (let i = 0; i < totalItems; i++) {
                    const timestamp = startDate + ((endDate - startDate) / totalItems) * i;
                    const date = new Date(timestamp);
                    const id = i + 1;
                    const isIncome = Math.random() < 0.5;

                    const titleList = isIncome ? titlesIncome : titlesOutcome;
                    const title = titleList[Math.floor(Math.random() * titleList.length)];

                    const sum = randomSum(10, 5000);

                    data.push({
                        id,
                        title,
                        amount: sum,
                        isIncome,
                        date: date.toISOString(),
                    });
                }

                resolve(data);
            }, 10);
        });
    } catch (error) {
        console.error("Error in getDataByUserId:", error);
        return [];
    }
};

