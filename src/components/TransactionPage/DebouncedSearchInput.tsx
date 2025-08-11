import { useState, useEffect } from 'react';

export const DebouncedSearchInput = ({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: React.Dispatch<React.SetStateAction<string>> }) => {
    const [, setDebouncedSearchQuery] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleInputChange}
            className="bg-[var(--color-card)] rounded-[10px] p-[10px] w-[300px] border-1 border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned hover:border-[var(--color-hover)] text-[16px] font-semibold"
        />
    );
};