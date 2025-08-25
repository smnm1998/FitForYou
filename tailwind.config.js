module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
        colors: {
            primary: '#f0fd82',
            'primary-hover': '#e6f066',
            success: '#2ed573',
            error: '#ff4757',
            'text-primary': '#333',
            'border-color': '#e0e0e0',
        },
        fontFamily: {
            sans: ['NanumSquare', 'system-ui', 'sans-serif'],
        },
        boxShadow: {
            'light': '0 2px 10px rgba(0, 0, 0, 0.1)',
            'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
        backdropBlur: {
            xs: '2px',
        },
        screens: {
            'mobile-s': '320px',
            'mobile': '375px',
            'mobile-l': '480px',
        },
        },
    },
    plugins: [],
}