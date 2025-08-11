export function IncomeOutcomeMap() {
    return (
        <section className="relative h-full border-1 border-[var(--color-fixed-text)] rounded-[10px] overflow-hidden transitioned cursor-pointer group">
            <div className="absolute top-0 left-0 w-full h-full bg-[var(--color-card)] flex justify-center items-center p-[31px] transitioned">
                <h3 className="transitioned group-hover:scale-110 text-center text-[var(--color-fixed-text)] text-[32px] font-semibold roboto">Map with transactions in future</h3>
            </div>
            <img className="w-full h-full object-cover opacity-10" src="./map-example.jpg" alt="in future" />
        </section>
    )
}