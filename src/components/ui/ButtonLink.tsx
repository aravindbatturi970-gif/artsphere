import { Link } from "react-router-dom";
import { buttonStyles } from "@/components/ui/Button";

type ButtonLinkProps = {
  /** Internal route (react-router). */
  to?: string;
  /** Same-page hash anchor, e.g. "#artists". */
  href?: string;
  variant?: "primary" | "brass" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  children: React.ReactNode;
};

/**
 * CTA link styled identically to Button. Use `to` for routes and `href`
 * for same-page anchors.
 */
export function ButtonLink({
  to,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  children,
}: ButtonLinkProps) {
  const classes = buttonStyles(variant, size, className);
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href ?? "#"} onClick={onClick} className={classes}>
      {children}
    </a>
  );
}
