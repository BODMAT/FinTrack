import { usePopupStore } from "../../store/popup";
import ArrToBottom from "../../assets/arr-to-bottom.svg?react";
import { useUserStore } from "../../store/user";
import AnonimusIcon from "../../assets/anonymous-user-icon.svg?react";
export function ProfileInfo({ changable = false }: { changable?: boolean }) {
    const { userId, userName, userPhoto } = useUserStore();
    const { open } = usePopupStore();
    const handleOpenPopup = () => {
        open("Change profile in future", <ProfileInfo />);
    }
    return (
        <button onClick={changable ? handleOpenPopup : undefined} className={`flex items-center gap-[10px] text-[var(--color-fixed-text)] transitioned text-[17px] font-bold group max-md:mx-auto 
        ${changable ? "cursor-pointer bg-transparent hover:bg-[var(--color-card)] rounded hover:shadow p-2" : ""}`}>
            <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[var(--color-hover-reverse)]">
                {userPhoto ? (
                    <div className="flex justify-center items-center h-full">
                        <img
                            className="w-[45px] h-[45px] rounded-full"
                            src={userPhoto}
                            alt="user photo"
                        />
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <AnonimusIcon className="w-[45px] h-[45px] rounded-full" />
                    </div>
                )}
            </div>
            {userId && (<span>{userName ?? "Anonimus"}<br /> tg id: {userId}</span>)}
            {!userId && (<span>Add personal token</span>)}

            {changable && (
                <ArrToBottom className="w-[20px] h-[20px] fill-current text-[var(--color-fixed-text)] transition-all duration-500 rotate-[-90deg] group-hover:rotate-0" />
            )}
        </button>
    )
}