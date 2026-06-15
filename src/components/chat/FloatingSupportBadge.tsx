import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSupportUnread } from "@/lib/use-support-unread";

/**
 * Persistent floating support badge. When the signed-in customer has unread
 * support replies, a glowing pill pulses bottom-left and deep-links to the
 * exact support inbox. Hidden entirely when there is nothing unread so it
 * never competes with the live-chat orb (bottom-right).
 */
export function FloatingSupportBadge() {
  const { user } = useAuth();
  const { count } = useSupportUnread();

  const show = !!user && count > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.85 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-4 z-[60]"
          style={{ bottom: "calc(var(--floating-bottom-offset))" }}
        >
          <Link
            to="/account_/support"
            aria-label={`${count} new support ${count === 1 ? "reply" : "replies"}`}
            className="group relative flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-accent to-accent/80 pl-4 pr-5 text-accent-foreground shadow-[var(--shadow-float)] transition-all duration-300 active:scale-90"
          >
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-accent/40 animate-ping"
            />
            <LifeBuoy className="size-5 shrink-0" />
            <span className="text-sm font-semibold leading-none">
              {count > 9 ? "9+" : count} new
            </span>
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-background px-1 text-[11px] font-bold text-accent">
              {count > 99 ? "99+" : count}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
