import type { IData, IUser } from "../types/custom";
import axios from "axios";
import { z } from "zod";
import { getFullStats } from "../utils/stats";

export const TransactionSchema = z.object({
    id: z.string(),

    userId: z.string(),
    title: z.string(),

    created_at: z.iso.datetime(),
    type: z.enum(["EXPENSE", "INCOME"]),

    amount: z.string()
        .refine(val => !isNaN(Number(val)), {
            message: "amount must be a number string",
        }),

    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }).optional(),
});

export const PaginationSchema = z.object({
    page: z.number(),
    perPage: z.number(),
    total: z.number(),
    totalPages: z.number(),
});

export const TransactionsResponseSchema = z.object({
    data: z.array(TransactionSchema).nullable(),
    pagination: PaginationSchema,
});

//! Временно

// export const getUserByNickAndPass = async (
//     nickname: string,
//     password: string,
//     page?: number,
//     perPage?: number,
// ): Promise<IUser> => {
//     try {
//         const response = await axios.get("https://fintrack-irxy.onrender.com/api/transactions", {
//             params: {
//                 user_id: "97e72bd8-96c2-4150-a98e-852de2ab46e8",
//                 page,
//                 perPage
//             },
//         });

//         const parsed = TransactionsResponseSchema.safeParse(response.data);
//         if (!parsed.success) {
//             console.error("Validation error:", parsed.error);
//             return {} as IUser;
//         }

//         return {
//             userPhoto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
//             nickname,
//             password,
//             userName: "Test User",
//             data: parsed.data.data,
//         }


//     } catch (error) {
//         console.error("Error in getUserByNickAndPass:", error);
//         return {} as IUser;
//     }
// };

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
                const totalItems = 1234;

                for (let i = 0; i < totalItems; i++) {
                    const timestamp = startDate + ((endDate - startDate) / totalItems) * i;
                    const date = new Date(timestamp);
                    const id = i + 1;
                    const isIncome = i % 2 === 0;

                    const titleList = isIncome ? titlesIncome : titlesOutcome;
                    const title = titleList[i % titleList.length];

                    const sum = 100 + (i % 50) * 10;

                    const location = {
                        latitude: 44.4 + ((52.4 - 44.4) / totalItems) * i,
                        longitude: 22.1 + ((40.2 - 22.1) / totalItems) * i,
                    };

                    data.push({
                        userId: "1",
                        id: id.toString(),
                        title,
                        amount: sum.toString(),
                        created_at: date.toISOString(),
                        location,
                        type: isIncome ? "INCOME" : "EXPENSE",
                    });
                }

                const slicedData = page && perPage
                    ? data.slice((page - 1) * perPage, page * perPage)
                    : data;

                const stats = getFullStats(slicedData);

                resolve({
                    nickname: nickname.toLowerCase(),
                    password,
                    userName: "Anonimus User",
                    userPhoto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    data: slicedData,
                    stats,
                });
            }, 500);
        });
    } catch (error) {
        console.error("Error in getUserByNickAndPass:", error);
        return {} as IUser;
    } finally {
        console.log("Test User Created");
    }
};

export const getTransaction = async (transactionId: string, userId?: string): Promise<IData | null> => {
    try {
        const response = await axios.get(`https://fintrack-irxy.onrender.com/api/transactions/${transactionId}`, {
            params: {
                user_id: userId,
            },
        });
        const parsed = TransactionSchema.safeParse(response.data);
        if (!parsed.success) {
            console.error("Validation error:", parsed.error);
            return null;
        }
        return parsed.data;
    } catch (error) {
        console.error("Error in getTransaction:", error);
        return null;
    }
};


export const changeTransaction = async (
    transactionId: string,
    data: IData,
    isNewOrChange: boolean = false
): Promise<IData> => {
    try {
        console.log("Input data for locaT:", data);

        const response = isNewOrChange
            ? await axios.post("https://fintrack-irxy.onrender.com/api/transactions", data)
            : await axios.patch(`https://fintrack-irxy.onrender.com/api/transactions/${transactionId}`, data);

        const parsed = TransactionSchema.safeParse(response.data);
        console.log("Response data for locaT:", response.data);
        if (!parsed.success) {
            throw new Error(`Validation error: ${parsed.error}`);
        }

        return parsed.data;
    } catch (error) {
        console.error("Error in changeTransaction:", error);
        throw error;
    }
};


export const deleteTransaction = async (transactionId: string): Promise<void> => {
    try {
        await axios.delete(`https://fintrack-irxy.onrender.com/api/transactions/${transactionId}`);
    } catch (error) {
        console.error("Error in deleteTransaction:", error);
        throw error;
    }
};