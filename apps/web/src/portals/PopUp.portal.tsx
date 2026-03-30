import { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import CrossIcon from "../assets/cross.svg?react";
import { usePopupStore } from "../store/popup";

export function PopUpPortal() {
  const { active, title, children, close } = usePopupStore();

  useEffect(() => {
    if (active) {
      document.body.classList.add("no-scroll-popup");
    } else {
      document.body.classList.remove("no-scroll-popup");
    }

    return () => {
      document.body.classList.remove("no-scroll-popup");
    };
  }, [active]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {active && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-[#0000008e] bg-opacity-50 !z-[99999] flex justify-center items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: "-50px" }}
            animate={{ opacity: 1, y: "0px" }}
            exit={{ opacity: 0, y: "-50px" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[var(--color-card)] rounded-lg overflow-hidden w-[90%] max-w-[800px] max-h-[95vh] shadow-lg relative !z-[99999] max-md:mt-[5vh] flex flex-col"
          >
            <div className="bg-[var(--color-fixed)] flex justify-between items-center p-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-[var(--color-text)]">
                {title}
              </h2>
              <button
                onClick={close}
                className="text-2xl font-bold cursor-pointer"
              >
                <CrossIcon className="stroke-current text-[var(--color-text)] transition-all duration-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-grow">{children}</div>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body,
  );
}
