import Link from "next/link";
import styles from "./StatCard.module.css";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    href?: string;
    iconBgColor: string;
    iconColor: string;
}

export default function StatCard({
    icon,
    label,
    value,
    href,
    iconBgColor,
    iconColor,
}: StatCardProps) {
    const content = (
        <div className={styles.card}>
            <div
                className={styles.iconWrapper}
                style={{ backgroundColor: iconBgColor }}
            >
                <div style={{ color: iconColor }}>{icon}</div>
            </div>
            <div className={styles.content}>
                <p className={styles.label}>{label}</p>
                <h3 className={styles.value}>{value}</h3>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className={styles.link}>
                {content}
            </Link>
        );
    }

    return <div className={styles.wrapper}>{content}</div>;
}
