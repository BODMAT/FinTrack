import { usePopupStore } from "../../store/popup";
import ArrToBottom from "../../assets/arr-to-bottom.svg?react";
export function ProfileInfo({ changable = false }: { changable?: boolean }) {
    const { open } = usePopupStore();
    const handleOpenPopup = () => {
        open("Change profile in future", <ProfileInfo />);
    }
    return (
        <button onClick={changable ? handleOpenPopup : undefined} className={`flex items-center gap-[10px] text-[var(--color-fixed-text)] transitioned text-[17px] font-bold group 
        ${changable ? "cursor-pointer hover:text-[var(--color-hover)] bg-transparent hover:bg-[var(--color-card)] rounded hover:shadow p-2" : ""}`}>
            <div className="w-[50px] h-[50px] rounded-full bg-[var(--color-hover)]"></div>
            <span>Name Surname<br /> tg id: 245545</span>
            {changable && (
                <ArrToBottom className="w-[20px] h-[20px] fill-current text-[var(--color-fixed-text)] transition-all duration-500 rotate-[-90deg] group-hover:rotate-0 group-hover:text-[var(--color-hover)]" />
            )}
        </button>
    )
}