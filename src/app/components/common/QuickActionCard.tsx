import Link from "next/link";
import styles from "./QuickActionCard.module.css";

interface QuickActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    href: string;
    variant: "diet" | "workout" | "empty";
}

export default function QuickActionCard({
    title,
    description,
    icon,
    badge,
    href,
    variant,
}: QuickActionCardProps) {
    const cardClass =
        variant === "empty"
            ? styles.emptyCard
            : variant === "diet"
            ? styles.dietCard
            : styles.workoutCard;

    const badgeClass =
        variant === "diet"
            ? styles.dietBadge
            : variant === "workout"
            ? styles.workoutBadge
            : styles.emptyBadge;

    const iconWrapperClass =
        variant === "diet"
            ? styles.dietIcon
            : variant === "workout"
            ? styles.workoutIcon
            : styles.emptyIcon;

    return (
        <Link href={href} className={cardClass}>
            <div className={styles.content}>
                <div className={iconWrapperClass}>{icon}</div>
                <div className={styles.textContent}>
                    <span className={styles.badgeClass}>{badge}</span>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.description}>{description}</p>
                </div>
            </div>
        </Link>
    );
}
