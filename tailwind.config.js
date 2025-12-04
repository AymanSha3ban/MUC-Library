/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#D32F2F',
                    50: '#FDEBEB',
                    100: '#FBD5D5',
                    200: '#F7AAAA',
                    300: '#F27F7F',
                    400: '#EE5555',
                    500: '#D32F2F',
                    600: '#B71C1C',
                    700: '#8E1616',
                    800: '#651010',
                    900: '#3C0A0A',
                },
                secondary: '#FFFFFF',
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
