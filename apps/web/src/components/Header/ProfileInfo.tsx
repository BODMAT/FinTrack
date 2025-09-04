import { usePopupStore } from "../../store/popup";
import ArrToBottom from "../../assets/arr-to-bottom.svg?react";
import AnonimusIcon from "../../assets/anonymous-user-icon.svg?react";
import { ProfileInfoPopup } from "./ProfileInfoPopup";
import { useUser } from "../../hooks/useUser";
export function ProfileInfo({ changable = false }: { changable?: boolean }) {
    const { user } = useUser();
    const { open } = usePopupStore();
    const handleOpenPopup = () => {
        open("Change profile info", <ProfileInfoPopup />);
    }
    return (
        <button onClick={changable ? handleOpenPopup : undefined} className={`flex items-center gap-[10px] text-[var(--color-fixed-text)] transitioned text-[17px] font-bold group max-md:mx-auto  
        ${changable ? "cursor-pointer bg-transparent hover:bg-[var(--color-card)] rounded hover:shadow p-2" : "w-full  justify-between"}`}>

            <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[var(--color-hover-reverse)]">
                {user && user.userPhoto ? (
                    <div className="flex justify-center items-center h-full">
                        <img
                            className="w-[45px] h-[45px] rounded-full"
                            src={user.userPhoto}
                            alt="user photo"
                        />
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <AnonimusIcon className="w-[45px] h-[45px] rounded-full" />
                    </div>
                )}
            </div>
            {user && (<span>{user.userName ?? "Anonimus"}<br /> tg: @{user.nickname}</span>)}
            {!user && (<span className="text-[16px]">Add telegram token</span>)}

            {changable && (
                <ArrToBottom className="w-[20px] h-[20px] fill-current text-[var(--color-fixed-text)] transition-all duration-500 rotate-[-90deg] group-hover:rotate-0" />
            )}
        </button>
    )
}