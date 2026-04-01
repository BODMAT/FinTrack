import { FixedHeader } from "../header/FixedHeader";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { Spinner } from "@/shared/ui/Helpers";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrapper inter bg-[image:var(--color-main)]">
      <div className="flex max-md:flex-col">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed-header-wrapper transitioned"
        >
          <FixedHeader />
        </motion.div>
        <motion.main
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="transitioned w-full p-[24px] md:ml-[300px] md:p-[28px] max-md:mt-[100px]"
        >
          <div className="glass-soft min-h-[calc(100vh-56px)] rounded-[24px] border border-(--stroke-soft) p-[20px] md:p-[24px]">
            <Suspense fallback={<Spinner />}>{children}</Suspense>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
