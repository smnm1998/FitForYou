export const formatGender = (gender: string): string => {
    return gender === "male" ? "남성" : "여성";
};

export const calculateAge = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMonths =
        (now.getFullYear() - created.getFullYear()) * 12 +
        now.getMonth() -
        created.getMonth();
    return `가입 ${diffMonths}개월 차`;
};
