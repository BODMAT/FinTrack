import type { IData, IUser } from "../types/custom";
import axios from "axios";
import { z } from "zod";

export const TransactionSchema = z.object({
    id: z.string(),

    userId: z.string(),
    title: z.string(),

    created_at: z.iso.datetime(),
    type: z.enum(["EXPENSE", "INCOME"]),

    amount: z.string().refine(val => !isNaN(Number(val)), {
        message: "amount must be a number string",
    }).transform(Number),

    location: z.object({
        latitude: z.string().refine(val => !isNaN(Number(val)), {
            message: "lat must be a number string",
        }).transform(Number),
        longitude: z.string().refine(val => !isNaN(Number(val)), {
            message: "lng must be a number string",
        }).transform(Number),
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

export const getUserByNickAndPass = async (
    nickname: string,
    password: string,
    page?: number,
    perPage?: number,
): Promise<IUser> => {
    try {
        const response = await axios.get("https://fintrack-irxy.onrender.com/api/transactions", {
            params: {
                user_id: "97e72bd8-96c2-4150-a98e-852de2ab46e8",
                page,
                perPage
            },
        });

        const parsed = TransactionsResponseSchema.safeParse(response.data);
        if (!parsed.success) {
            console.error("Validation error:", parsed.error);
            return {} as IUser;
        }

        return {
            userPhoto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            nickname,
            password,
            userName: "Test User",
            data: parsed.data.data,
        }


    } catch (error) {
        console.error("Error in getUserByNickAndPass:", error);
        return {} as IUser;
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