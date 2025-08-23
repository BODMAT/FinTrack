import { useState, useEffect } from "react";

export const DebouncedSearchInput = ({
    searchQuery,
    setDebouncedSearchQuery,
}: {
    searchQuery: string;
    setDebouncedSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) => {
    const [inputValue, setInputValue] = useState(searchQuery);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(inputValue);
        }, 500);

        return () => clearTimeout(handler);
    }, [inputValue, setDebouncedSearchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    return (
        <input
            type="text"
            placeholder="Search"
            value={inputValue}
            onChange={handleInputChange}
            className="bg-[var(--color-card)] rounded-[10px] p-[10px] w-[300px] border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)] text-[16px] font-semibold"
        />
    );
};
