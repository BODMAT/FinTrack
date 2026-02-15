import { Outlet } from "react-router-dom";
import { FixedHeader } from "../Header/FixedHeader";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { Spinner } from "../Helpers";

export function Layout() {
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
          className="transitioned p-[31px] md:ml-[300px] max-md:mt-[100px] w-full"
        >
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </div>
    </div>
  );
}
