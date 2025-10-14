"use client";

import styles from "./ActionCard.module.css";

interface ActionCardProps {
    icon: string;
    title: string;
    description: string;
    buttonText: string;
    onClick: () => void;
    disabled?: boolean;
}

export default function ActionCard({
    icon,
    title,
    description,
    buttonText,
    onClick,
    disabled = false,
}: ActionCardProps) {
    return (
        <div className={`${styles.card} ${disabled ? styles.disabled : ""}`}>
            <div className={styles.content}>
                <div className={styles.icon}>{icon}</div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
            <button
                className={styles.button}
                onClick={onClick}
                disabled={disabled}
            >
                {buttonText}
            </button>
        </div>
    );
}
