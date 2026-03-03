/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
    theme: {
      extend: {
        screens: {
          'sm': '640px',
          // => @media (min-width: 640px) { ... }
    
          'md': '768px',
          // => @media (min-width: 768px) { ... }
    
          'lg': '1024px',
          // => @media (min-width: 1024px) { ... }
    
          'xl': '1280px',
          // => @media (min-width: 1280px) { ... }
    
          '2xl': '1536px',
          // => @media (min-width: 1536px) { ... }
        },
        fontFamily: {
          sans: 'Roboto, sans-serif'
        },
        container: {
            center: true,
          },
        colors: {
          esat: {
            100: '#C7C8C9',
            200: '#D8C4C4',
            300: '#7c060e',
            500: '#BE0411',
          },
  
          red: {
            500: '#9A060E',
            600: '#A32030',
            700: '#C00404',
          },
  
          gray: {
            100: '#F0F0F7',
            200: '#F0EDED',
            300: '#8D8D99',
            400: '#FFFFFF',
            500: '#7A817A',
            600: '#F7F8FD',
            800: '#8D8D99',
            900: '#121214'
          },
          signin: {
            300: '#7A817A',
            400: '#4A4545'
          },
          ppp: {
            100: '#009999',
            200: '#DCA00A',
            300: '#025EFF',
            400: '#28A745'
          }
        }
      },
    },
    plugins: [ ],
  }