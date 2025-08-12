import { useState } from "react";
import { useUserData } from "../../hooks/useUserData";
import { NoData, Spinner } from "../Helpers";

export function Analitycs() {
    const { data, isLoading, isError } = useUserData();
    const [state, setState] = useState({
        response: null as string | null,
        prompt: "",
        loading: false,
    });


    if (isLoading) return <Spinner />;
    if (isError || !data) return <NoData />;

    // async function handleAnalyze() {
    //     if (!data) {
    //         setState(prev => ({ ...prev, response: "Data not found" }));
    //         return;
    //     }

    //     setState(prev => ({ ...prev, loading: true, response: null }));

    //     try {
    //         const result = await analyze(data, state.prompt);
    //         setState(prev => ({ ...prev, response: result }));
    //     } catch (e) {
    //         setState(prev => ({ ...prev, response: "Error, please try again" }));
    //     } finally {
    //         setState(prev => ({ ...prev, loading: false }));
    //     }
    // }

    return (
        <section className="w-full">
            <h1 className="text-[var(--color-title)] text-[32px] font-semibold mb-6">Analytics</h1>

            <div className="flex gap-6 justify-between items-center">
                <textarea name="prompt"
                    value={state.prompt}
                    onChange={e => setState(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Your prompt"
                    id="prompt"
                    className="w-full max-h-36 min-h-12 border-1 border-[var(--color-fixed-text)] rounded-[5px] p-3 text-[var(--color-text)] scrollable
                    resize-none transitioned text-[16px] font-semibold"
                />

                <button
                    // onClick={handleAnalyze}
                    type="button"
                    disabled={state.loading}
                    className="w-[120px] h-12 border-1 border-[var(--color-fixed-text)] rounded-[10px] p-3 text-[var(--color-text)] cursor-pointer
                    transitioned hover:bg-[var(--color-fixed-text)] hover:text-[var(--color-card)] text-[16px] font-semibold"
                >
                    Analyze
                </button>
            </div>

            {state.response && <p className="mt-6 text-[var(--color-text)]">{state.response}</p>}
        </section>
    );
}
